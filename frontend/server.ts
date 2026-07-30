import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "plum_ai_secret_key_2026";

// Static logos upload path
const UPLOAD_DIR = path.join(process.cwd(), "public", "static", "logos");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".png";
      cb(null, `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`);
    },
  }),
});

// Document uploads directory
const DOC_UPLOAD_DIR = path.join(process.cwd(), "public", "static", "docs");
fs.mkdirSync(DOC_UPLOAD_DIR, { recursive: true });

const docUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, DOC_UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".txt";
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

// ---------------------------------------------------------------------------
// In-Memory Data Models & Mock Storage
// ---------------------------------------------------------------------------

interface User {
  id: number;
  email: string;
  full_name: string;
  password_hash: string;
}

interface Business {
  id: number;
  owner_id: number;
  name: string;
  description: string;
  logo_url: string | null;
  created_at: string;
}

interface Document {
  id: number;
  business_id: number;
  filename: string;
  file_type: string;
  status: "processing" | "completed" | "error";
  content_text: string;
  char_count: number;
  file_path: string | null;
  error_message: string | null;
  created_at: string;
}

interface ChatSession {
  id: string;
  business_id: number;
  customer_name: string;
  customer_email: string | null;
  created_at: string;
}

interface Message {
  id: number;
  session_id: string;
  sender: "user" | "bot" | "admin";
  content: string;
  citations: any[];
  created_at: string;
}

interface Team {
  id: number;
  business_id: number;
  name: string;
  description: string | null;
  created_at: string;
}

interface ApiKey {
  id: number;
  business_id: number;
  name: string;
  key: string;
  created_at: string;
  last_used: string;
}

interface Webhook {
  id: number;
  business_id: number;
  name: string;
  url: string;
  status: "active" | "inactive";
  success_rate: number;
  created_at: string;
}

interface WidgetConfig {
  position: "bottom-right" | "bottom-left";
  greeting: string;
  accent_color: string;
  allowed_domains: string[];
  csp_mode: boolean;
}

const apiKeys: ApiKey[] = [
  {
    id: 1,
    business_id: 1,
    name: "Production_Main",
    key: "pk_live_8x92k2024plmai3f8j",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    last_used: "2h ago",
  },
];

const webhooks: Webhook[] = [
  {
    id: 1,
    business_id: 1,
    name: "Human Intervention Required",
    url: "https://hooks.enterprise.co/v1/plum-alerts",
    status: "active",
    success_rate: 100,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

const widgetConfigs = new Map<number, WidgetConfig>([
  [
    1,
    {
      position: "bottom-right",
      greeting: "Hello! How can Plum help you today?",
      accent_color: "#300033",
      allowed_domains: ["*.plum.ai", "app.enterprise.co"],
      csp_mode: true,
    },
  ],
]);


// Initial Data Seed
const hashedPassword = bcrypt.hashSync("password123", 10);

const users: User[] = [
  {
    id: 1,
    email: "demo@plum.ai",
    full_name: "Demo Manager",
    password_hash: hashedPassword,
  },
];

const businesses: Business[] = [
  {
    id: 1,
    owner_id: 1,
    name: "Acme Corp",
    description: "Cloud-native SaaS customer support operations",
    logo_url: null,
    created_at: new Date().toISOString(),
  },
];

const documents: Document[] = [
  {
    id: 1,
    business_id: 1,
    filename: "Company_Knowledge_Base.pdf",
    file_type: "pdf",
    status: "completed",
    content_text:
      "Acme Support provides 24/7 technical help. Standard return policy allows 30-day refunds. Business hours are 9 AM - 6 PM EST.",
    char_count: 154,
    file_path: "/static/docs/Company_Knowledge_Base.pdf",
    error_message: null,
    created_at: new Date().toISOString(),
  },
];

const chatSessions: ChatSession[] = [
  {
    id: "session-demo-101",
    business_id: 1,
    customer_name: "Sarah Jenkins",
    customer_email: "sarah@example.com",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

const messages: Message[] = [
  {
    id: 1,
    session_id: "session-demo-101",
    sender: "user",
    content: "Hi! What is your standard refund policy?",
    citations: [],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 2,
    session_id: "session-demo-101",
    sender: "bot",
    content:
      "Hello! Our standard return policy allows full refunds within 30 days of purchase.",
    citations: [
      {
        document_id: 1,
        filename: "Company_Knowledge_Base.pdf",
        snippet: "Standard return policy allows 30-day refunds.",
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 2 + 2000).toISOString(),
  },
];

const teams: Team[] = [
  {
    id: 1,
    business_id: 1,
    name: "Acme Support Team",
    description: "Core Customer Experience & Escalations Team",
    created_at: new Date().toISOString(),
  },
];

const teamMembers: TeamMember[] = [
  {
    id: 1,
    team_id: 1,
    user_id: 1,
    role: "admin",
    joined_at: new Date().toISOString(),
  },
];

// Helper to get Lazy Gemini Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAIClient;
}

// Custom request interface with authenticated user
interface AuthenticatedRequest extends Request {
  user?: {
    user_id: number;
    email: string;
  };
}

// Auth Middleware
function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ detail: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      user_id: number;
      email: string;
    };
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ detail: "Invalid or expired token" });
  }
}

// Generate JWT Tokens
function generateTokens(user_id: number, email: string) {
  const access_token = jwt.sign({ user_id, email }, JWT_SECRET, {
    expiresIn: "1d",
  });
  const refresh_token = jwt.sign({ user_id, email, type: "refresh" }, JWT_SECRET, {
    expiresIn: "7d",
  });
  return { access_token, refresh_token };
}

// ---------------------------------------------------------------------------
// Express Application Setup
// ---------------------------------------------------------------------------

async function startApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Static assets endpoint for logos & docs
  app.use("/static", express.static(path.join(process.cwd(), "public", "static")));

  // System Health Endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "healthy", service: "Plum.ai" });
  });

  // ==========================================
  // Auth Routes (/api/auth)
  // ==========================================

  app.post("/api/auth/register", (req, res) => {
    const { email, password, full_name } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ detail: "Email and password are required." });
    }

    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res
        .status(400)
        .json({ detail: "A user with this email already exists." });
    }

    const newUser: User = {
      id: users.length + 1,
      email,
      full_name: full_name || email.split("@")[0],
      password_hash: bcrypt.hashSync(password, 10),
    };
    users.push(newUser);

    const tokens = generateTokens(newUser.id, newUser.email);
    res.status(201).json(tokens);
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find((u) => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).json({ detail: "Incorrect email or password." });
    }

    const tokens = generateTokens(user.id, user.email);
    res.json(tokens);
  });

  app.post("/api/auth/refresh", (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(401).json({ detail: "Invalid refresh token." });
    }

    try {
      const payload = jwt.verify(refresh_token, JWT_SECRET) as {
        user_id: number;
        email: string;
        type?: string;
      };
      if (payload.type !== "refresh") {
        return res.status(401).json({ detail: "Invalid refresh token." });
      }

      const user = users.find((u) => u.id === payload.user_id);
      if (!user) {
        return res.status(401).json({ detail: "User not found." });
      }

      const tokens = generateTokens(user.id, user.email);
      res.json(tokens);
    } catch (e) {
      return res.status(401).json({ detail: "Invalid refresh token." });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res) => {
    const user = users.find((u) => u.id === req.user?.user_id);
    if (!user) return res.status(404).json({ detail: "User not found." });

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_active: true,
      is_superuser: false,
    });
  });

  app.put("/api/auth/profile", authenticateToken, (req: AuthenticatedRequest, res) => {
    const user = users.find((u) => u.id === req.user?.user_id);
    if (!user) return res.status(404).json({ detail: "User not found." });

    if (req.body.full_name) {
      user.full_name = req.body.full_name;
    }

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      is_active: true,
      is_superuser: false,
    });
  });

  app.post(
    "/api/auth/change-password",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const user = users.find((u) => u.id === req.user?.user_id);
      if (!user) return res.status(404).json({ detail: "User not found." });

      const { current_password, new_password } = req.body;
      if (!bcrypt.compareSync(current_password, user.password_hash)) {
        return res
          .status(401)
          .json({ detail: "Current password is incorrect." });
      }

      if (!new_password || new_password.length < 8) {
        return res.status(400).json({
          detail: "New password must be at least 8 characters long.",
        });
      }

      user.password_hash = bcrypt.hashSync(new_password, 10);
      res.json({ message: "Password changed successfully." });
    }
  );

  // ==========================================
  // Business Routes (/api/businesses)
  // ==========================================

  app.get("/api/businesses", authenticateToken, (req: AuthenticatedRequest, res) => {
    const userBusinesses = businesses.filter(
      (b) => b.owner_id === req.user?.user_id
    );
    res.json(userBusinesses);
  });

  app.post("/api/businesses", authenticateToken, (req: AuthenticatedRequest, res) => {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ detail: "Business name is required." });
    }

    const newBusiness: Business = {
      id: businesses.length + 1,
      owner_id: req.user!.user_id,
      name,
      description: description || "",
      logo_url: null,
      created_at: new Date().toISOString(),
    };
    businesses.push(newBusiness);

    // Auto-create team for business
    const newTeam: Team = {
      id: teams.length + 1,
      business_id: newBusiness.id,
      name: `${name} Team`,
      description: "Default Workspace Team",
      created_at: new Date().toISOString(),
    };
    teams.push(newTeam);

    teamMembers.push({
      id: teamMembers.length + 1,
      team_id: newTeam.id,
      user_id: req.user!.user_id,
      role: "admin",
      joined_at: new Date().toISOString(),
    });

    res.status(201).json(newBusiness);
  });

  app.get(
    "/api/businesses/:id",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.id, 10);
      const business = businesses.find(
        (b) => b.id === businessId && b.owner_id === req.user?.user_id
      );
      if (!business) {
        return res
          .status(404)
          .json({ detail: "Business workspace not found or unauthorized access." });
      }
      res.json(business);
    }
  );

  app.put(
    "/api/businesses/:id",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.id, 10);
      const business = businesses.find(
        (b) => b.id === businessId && b.owner_id === req.user?.user_id
      );
      if (!business) {
        return res
          .status(404)
          .json({ detail: "Business workspace not found or unauthorized access." });
      }

      if (req.body.name !== undefined) business.name = req.body.name;
      if (req.body.description !== undefined)
        business.description = req.body.description;
      if (req.body.logo_url !== undefined)
        business.logo_url = req.body.logo_url;

      res.json(business);
    }
  );

  app.delete(
    "/api/businesses/:id",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.id, 10);
      const index = businesses.findIndex(
        (b) => b.id === businessId && b.owner_id === req.user?.user_id
      );
      if (index === -1) {
        return res
          .status(404)
          .json({ detail: "Business workspace not found or unauthorized access." });
      }

      businesses.splice(index, 1);
      res.status(204).send();
    }
  );

  app.post(
    "/api/businesses/:id/logo",
    authenticateToken,
    upload.single("file"),
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.id, 10);
      const business = businesses.find(
        (b) => b.id === businessId && b.owner_id === req.user?.user_id
      );
      if (!business) {
        return res
          .status(404)
          .json({ detail: "Business workspace not found or unauthorized access." });
      }

      if (!req.file) {
        return res.status(400).json({ detail: "No image file provided." });
      }

      const logoUrl = `/static/logos/${req.file.filename}`;
      business.logo_url = logoUrl;
      res.json(business);
    }
  );

  // ==========================================
  // Knowledge Base Routes (/api/businesses/:business_id/kb)
  // ==========================================

  app.get(
    "/api/businesses/:business_id/kb/documents",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const docs = documents.filter((d) => d.business_id === businessId);
      res.json(docs);
    }
  );

  app.post(
    "/api/businesses/:business_id/kb/upload",
    authenticateToken,
    docUpload.single("file"),
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ detail: "No file uploaded." });
      }

      const ext = path.extname(file.originalname).replace(".", "").toLowerCase();
      let extractedText = `Document content extracted from ${file.originalname}.`;
      
      // Read text if txt/csv/md
      if (["txt", "csv", "md"].includes(ext)) {
        try {
          extractedText = fs.readFileSync(file.path, "utf-8");
        } catch (e) {
          // fallback
        }
      }

      const newDoc: Document = {
        id: documents.length + 1,
        business_id: businessId,
        filename: file.originalname,
        file_type: ext || "txt",
        status: "completed",
        content_text: extractedText,
        char_count: extractedText.length,
        file_path: `/static/docs/${file.filename}`,
        error_message: null,
        created_at: new Date().toISOString(),
      };

      documents.push(newDoc);
      res.status(202).json(newDoc);
    }
  );

  app.post(
    "/api/businesses/:business_id/kb/url",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const { url } = req.body;

      if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
        return res
          .status(400)
          .json({ detail: "Invalid URL format. Must start with http:// or https://" });
      }

      const newDoc: Document = {
        id: documents.length + 1,
        business_id: businessId,
        filename: url,
        file_type: "url",
        status: "completed",
        content_text: `Scraped content from website: ${url}`,
        char_count: 120,
        file_path: null,
        error_message: null,
        created_at: new Date().toISOString(),
      };

      documents.push(newDoc);
      res.status(202).json(newDoc);
    }
  );

  app.get(
    "/api/businesses/:business_id/kb/documents/:document_id/download",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const docId = parseInt(req.params.document_id, 10);

      const doc = documents.find(
        (d) => d.id === docId && d.business_id === businessId
      );
      if (!doc) {
        return res.status(404).json({ detail: "Document not found." });
      }

      if (doc.file_type === "url" || !doc.file_path) {
        return res
          .status(400)
          .json({ detail: "URL-sourced documents do not have a downloadable file." });
      }

      res.json({
        document_id: doc.id,
        filename: doc.filename,
        download_url: doc.file_path,
        expires_in_seconds: 3600,
      });
    }
  );

  app.delete(
    "/api/businesses/:business_id/kb/documents/:document_id",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const docId = parseInt(req.params.document_id, 10);

      const index = documents.findIndex(
        (d) => d.id === docId && d.business_id === businessId
      );
      if (index === -1) {
        return res.status(404).json({ detail: "Document not found." });
      }

      documents.splice(index, 1);
      res.status(204).send();
    }
  );

  // ==========================================
  // Teams Routes (/api/teams)
  // ==========================================

  app.get(
    "/api/teams/:business_id",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const team = teams.find((t) => t.business_id === businessId);
      if (!team) {
        return res.status(404).json({ detail: "Team not found." });
      }

      const members = teamMembers.filter((m) => m.team_id === team.id);
      res.json({
        id: team.id,
        name: team.name,
        description: team.description,
        members_count: members.length,
        created_at: team.created_at,
      });
    }
  );

  app.post(
    "/api/teams/:business_id",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const existingTeam = teams.find((t) => t.business_id === businessId);

      if (existingTeam) {
        return res
          .status(400)
          .json({ detail: "Team already exists for this business." });
      }

      const { name, description } = req.body;
      const newTeam: Team = {
        id: teams.length + 1,
        business_id: businessId,
        name: name || "Support Team",
        description: description || null,
        created_at: new Date().toISOString(),
      };
      teams.push(newTeam);

      res.status(201).json({
        id: newTeam.id,
        name: newTeam.name,
        business_id: newTeam.business_id,
      });
    }
  );

  app.get(
    "/api/teams/:business_id/members",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const team = teams.find((t) => t.business_id === businessId);
      if (!team) return res.json([]);

      const members = teamMembers
        .filter((m) => m.team_id === team.id)
        .map((m) => {
          const u = users.find((usr) => usr.id === m.user_id);
          return {
            id: m.id,
            user_id: m.user_id,
            email: u ? u.email : "member@plum.ai",
            full_name: u ? u.full_name : "Team Member",
            role: m.role,
            joined_at: m.joined_at,
          };
        });

      res.json(members);
    }
  );

  app.post(
    "/api/teams/:business_id/members",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const { email, role } = req.body;

      let team = teams.find((t) => t.business_id === businessId);
      if (!team) {
        team = {
          id: teams.length + 1,
          business_id: businessId,
          name: "Default Support Team",
          description: null,
          created_at: new Date().toISOString(),
        };
        teams.push(team);
      }

      let user = users.find((u) => u.email === email);
      if (!user) {
        user = {
          id: users.length + 1,
          email,
          full_name: email.split("@")[0],
          password_hash: bcrypt.hashSync("password123", 10),
        };
        users.push(user);
      }

      const existingMember = teamMembers.find(
        (m) => m.team_id === team!.id && m.user_id === user!.id
      );
      if (existingMember) {
        return res
          .status(400)
          .json({ detail: "User is already a member of this team." });
      }

      const newMember: TeamMember = {
        id: teamMembers.length + 1,
        team_id: team.id,
        user_id: user.id,
        role: role || "member",
        joined_at: new Date().toISOString(),
      };
      teamMembers.push(newMember);

      res.status(201).json({
        id: newMember.id,
        user_id: user.id,
        email: user.email,
        role: newMember.role,
        joined_at: newMember.joined_at,
      });
    }
  );

  app.put(
    "/api/teams/:business_id/members/:member_id",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const memberId = parseInt(req.params.member_id, 10);
      const member = teamMembers.find((m) => m.id === memberId);
      if (!member) {
        return res.status(404).json({ detail: "Team member not found." });
      }

      if (req.body.role) {
        member.role = req.body.role;
      }

      const u = users.find((usr) => usr.id === member.user_id);
      res.json({
        id: member.id,
        user_id: member.user_id,
        email: u ? u.email : "member@plum.ai",
        role: member.role,
      });
    }
  );

  app.delete(
    "/api/teams/:business_id/members/:member_id",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const memberId = parseInt(req.params.member_id, 10);
      const index = teamMembers.findIndex((m) => m.id === memberId);
      if (index === -1) {
        return res.status(404).json({ detail: "Team member not found." });
      }

      teamMembers.splice(index, 1);
      res.status(204).send();
    }
  );

  // ==========================================
  // Analytics Routes (/api/businesses/:business_id/analytics)
  // ==========================================

  app.get(
    "/api/businesses/:business_id/analytics/overview",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const sessions = chatSessions.filter((s) => s.business_id === businessId);

      const total_chats = sessions.length > 0 ? sessions.length : 42891;
      const daily_users = sessions.length > 0 ? Math.ceil(sessions.length * 0.4) : 1420;

      res.json({
        total_chats,
        daily_users,
        avg_response_time: 0.8,
        satisfaction_rate: 94.0,
        knowledge_coverage: 96.5,
      });
    }
  );

  app.get(
    "/api/businesses/:business_id/analytics/timeline",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const mockTimeline = [
        { date: "May 01", conversations: 120, avg_response_time: 0.9 },
        { date: "May 08", conversations: 240, avg_response_time: 0.85 },
        { date: "May 15", conversations: 480, avg_response_time: 0.78 },
        { date: "May 22", conversations: 180, avg_response_time: 0.82 },
        { date: "May 29", conversations: 520, avg_response_time: 0.75 },
      ];
      res.json(mockTimeline);
    }
  );

  app.get(
    "/api/businesses/:business_id/analytics/top-questions",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const mockQuestions = [
        {
          question: "What are your business hours?",
          frequency: 842,
          resolution_rate: 98.5,
          ai_confidence: 0.98,
        },
        {
          question: "Do you offer refunds or exchanges?",
          frequency: 532,
          resolution_rate: 87.2,
          ai_confidence: 0.85,
        },
        {
          question: "Where is your physical office located?",
          frequency: 412,
          resolution_rate: 99.1,
          ai_confidence: 0.99,
        },
        {
          question: "How do I cancel my subscription?",
          frequency: 381,
          resolution_rate: 78.4,
          ai_confidence: 0.81,
        },
        {
          question: "How can I contact support directly?",
          frequency: 290,
          resolution_rate: 91.5,
          ai_confidence: 0.9,
        },
      ];
      res.json(mockQuestions);
    }
  );

  // ==========================================
  // Chat Routes (/api/chat)
  // ==========================================

  app.post("/api/chat/sessions", (req, res) => {
    const business_id = parseInt(req.query.business_id as string, 10);
    const { customer_name, customer_email } = req.body || {};

    const newSession: ChatSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      business_id: business_id || 1,
      customer_name: customer_name || "Visitor",
      customer_email: customer_email || null,
      created_at: new Date().toISOString(),
    };

    chatSessions.push(newSession);
    res.status(201).json(newSession);
  });

  app.get(
    "/api/chat/sessions",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.query.business_id as string, 10);
      const businessSessions = chatSessions.filter(
        (s) => s.business_id === businessId
      );
      res.json(businessSessions);
    }
  );

  app.get(
    "/api/chat/sessions/:session_id/messages",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const { session_id } = req.params;
      const sessionMsgs = messages.filter((m) => m.session_id === session_id);
      res.json(sessionMsgs);
    }
  );

  app.post(
    "/api/chat/sessions/:session_id/admin-message",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const { session_id } = req.params;
      const { content, citations } = req.body;

      const adminMsg: Message = {
        id: messages.length + 1,
        session_id,
        sender: "admin",
        content,
        citations: citations || [],
        created_at: new Date().toISOString(),
      };
      messages.push(adminMsg);
      res.status(201).json(adminMsg);
    }
  );

  // Streaming SSE response for chat widget
  app.post("/api/chat/sessions/:session_id/stream", async (req, res) => {
    const { session_id } = req.params;
    const { content } = req.body;

    const session = chatSessions.find((s) => s.id === session_id);
    const businessId = session ? session.business_id : 1;

    // Save user message
    const userMsg: Message = {
      id: messages.length + 1,
      session_id,
      sender: "user",
      content: content || "Hello",
      citations: [],
      created_at: new Date().toISOString(),
    };
    messages.push(userMsg);

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Gather Knowledge Base context
    const businessDocs = documents.filter((d) => d.business_id === businessId);
    const kbContext = businessDocs.map((d) => d.content_text).join("\n\n");

    const ai = getGenAI();
    let fullText = "";
    const citations: any[] = businessDocs.length > 0
      ? [
          {
            document_id: businessDocs[0].id,
            filename: businessDocs[0].filename,
            snippet: businessDocs[0].content_text.slice(0, 80),
          },
        ]
      : [];

    if (ai) {
      try {
        const prompt = `You are an AI Customer Support Assistant for business #${businessId}.
Context from Knowledge Base:
${kbContext || "No additional document context provided."}

User query: ${content}
Provide a helpful, friendly, and accurate response.`;

        const responseStream = await ai.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            fullText += chunk.text;
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
      } catch (err: any) {
        console.error("Gemini API stream error:", err);
        fullText = `Thank you for reaching out to customer support! We received your question: "${content}". Our knowledge base indicates our team is ready to assist you.`;
        res.write(`data: ${JSON.stringify({ text: fullText })}\n\n`);
      }
    } else {
      // Fallback response generator if GEMINI_API_KEY is not set yet
      if (content.toLowerCase().includes("refund")) {
        fullText = "Our standard return policy allows full refunds within 30 days of purchase. Please contact support with your order number.";
      } else if (content.toLowerCase().includes("hour")) {
        fullText = "Our business hours are Monday through Friday, 9:00 AM to 6:00 PM EST.";
      } else {
        fullText = `Hello! Thank you for contacting customer support. Regarding "${content}", our automated system and support team are dedicated to providing fast resolution. ${kbContext ? `From our Knowledge Base: "${kbContext.slice(0, 100)}..."` : ""}`;
      }
      
      // Simulate chunking for stream
      const words = fullText.split(" ");
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ text: word + " " })}\n\n`);
        await new Promise((r) => setTimeout(r, 40));
      }
    }

    // Write final citations
    res.write(`data: ${JSON.stringify({ citations })}\n\n`);
    res.end();

    // Save bot message to history
    messages.push({
      id: messages.length + 1,
      session_id,
      sender: "bot",
      content: fullText,
      citations,
      created_at: new Date().toISOString(),
    });
  });

  // ==========================================
  // Widget Config Routes
  // ==========================================
  app.get(
    "/api/businesses/:business_id/widget-config",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const config = widgetConfigs.get(businessId) || {
        position: "bottom-right",
        greeting: "Hello! How can Plum help you today?",
        accent_color: "#300033",
        allowed_domains: ["*.plum.ai", "app.enterprise.co"],
        csp_mode: true,
      };
      res.json(config);
    }
  );

  app.put(
    "/api/businesses/:business_id/widget-config",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const existing = widgetConfigs.get(businessId) || {
        position: "bottom-right",
        greeting: "Hello! How can Plum help you today?",
        accent_color: "#300033",
        allowed_domains: ["*.plum.ai"],
        csp_mode: true,
      };
      const updated = { ...existing, ...req.body };
      widgetConfigs.set(businessId, updated);
      res.json(updated);
    }
  );

  // ==========================================
  // API Keys Routes
  // ==========================================
  app.get(
    "/api/businesses/:business_id/api-keys",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const keys = apiKeys.filter((k) => k.business_id === businessId);
      res.json(keys);
    }
  );

  app.post(
    "/api/businesses/:business_id/api-keys",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const { name } = req.body;
      const newKey: ApiKey = {
        id: apiKeys.length + 1,
        business_id: businessId,
        name: name || `Key_${Date.now().toString(36)}`,
        key: `pk_live_${Math.random().toString(36).substring(2, 18)}`,
        created_at: new Date().toISOString(),
        last_used: "Just created",
      };
      apiKeys.push(newKey);
      res.status(201).json(newKey);
    }
  );

  app.delete(
    "/api/businesses/:business_id/api-keys/:key_id",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const keyId = parseInt(req.params.key_id, 10);
      const idx = apiKeys.findIndex((k) => k.id === keyId);
      if (idx !== -1) apiKeys.splice(idx, 1);
      res.status(204).send();
    }
  );

  // ==========================================
  // Webhooks Routes
  // ==========================================
  app.get(
    "/api/businesses/:business_id/webhooks",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const hooks = webhooks.filter((w) => w.business_id === businessId);
      res.json(hooks);
    }
  );

  app.post(
    "/api/businesses/:business_id/webhooks",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const { name, url } = req.body;
      const newHook: Webhook = {
        id: webhooks.length + 1,
        business_id: businessId,
        name: name || "Outgoing Webhook",
        url: url || "https://hooks.enterprise.co/v1/plum-alerts",
        status: "active",
        success_rate: 100,
        created_at: new Date().toISOString(),
      };
      webhooks.push(newHook);
      res.status(201).json(newHook);
    }
  );

  app.delete(
    "/api/businesses/:business_id/webhooks/:webhook_id",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const hookId = parseInt(req.params.webhook_id, 10);
      const idx = webhooks.findIndex((w) => w.id === hookId);
      if (idx !== -1) webhooks.splice(idx, 1);
      res.status(204).send();
    }
  );

  // ==========================================
  // KB Resync Route
  // ==========================================
  app.post(
    "/api/businesses/:business_id/kb/resync",
    authenticateToken,
    (req: AuthenticatedRequest, res) => {
      const businessId = parseInt(req.params.business_id, 10);
      const docs = documents.filter((d) => d.business_id === businessId);
      docs.forEach((d) => (d.status = "completed"));
      res.json({ message: "Resynced all documents", count: docs.length });
    }
  );


  // ==========================================
  // Vite Integration (Development vs Production)
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: process.cwd(),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Plum.ai] Server running on http://0.0.0.0:${PORT}`);
  });
}

startApp().catch((err) => {
  console.error("Failed to start server:", err);
});
