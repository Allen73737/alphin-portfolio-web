# Alphin Francis — 3D Interactive Robotics & Automation Portfolio

<div align="center">

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Motion](https://img.shields.io/badge/Motion-12.2-FF0055?style=flat&logo=framer&logoColor=white)](https://motion.dev/)
[![License](https://img.shields.io/badge/License-Private-yellow.svg)](LICENSE)

An immersive, high-performance 3D interactive portfolio website showcasing the engineering work, industrial robotics projects, research, and technical dossier of **Alphin Francis** — Robotics & Automation Engineer (M.Sc. TU Dortmund).

[Live Demo](https://github.com/Allen73737/alphin-portfolio-web) · [Report Bug](https://github.com/Allen73737/alphin-portfolio-web/issues) · [Request Feature](https://github.com/Allen73737/alphin-portfolio-web/issues)

</div>

---

## 🌟 Overview

This portfolio combines an industrial, cybernetic design system with real-time 3D mechanics and interactive robotics simulations. Designed for engineering leaders, recruiters, and collaborators, it presents practical applications across **Universal Robots (UR10/UR20)**, **Stäubli (VAL3)**, **computer vision pipelines**, **ROS/Gazebo simulation**, and **mobile manipulation**.

The application is engineered with an emphasis on fluid performance, sensory visual feedback, multi-language internationalization, and accessibility.

---

## ⚡ Key Highlights & Features

### 🤖 Custom 3D Software Rendering Engine
- **Zero-Dependency 3D Pipeline**: Built from scratch using HTML5 Canvas (`engine.ts`) with custom 3D matrix math (translation, Euler rotations, perspective projection, depth sorting, wireframes, and surface shading) without the overhead of heavy 3D frameworks.
- **Interactive 3D Robot Models**: Real-time rendering of robot busts, custom robot arms, sensor rigs, and an interactive robot companion buddy that reacts to cursor position.
- **Preloader 3D**: Dynamic robotic startup assembly sequence with system initialization progress.

### 🦾 Interactive Kinematics Lab
- **Real-Time Kinematic Simulation**: Interactive forward kinematics simulator allowing users to manipulate joint angles and inspect live end-effector coordinates $(X, Y, Z)$ and target orientations in real time.

### 🏭 Systems & Automation Lab
- **Step-by-Step Engineering Flow**: Explores the 3 key phases of industrial robotics commissioning:
  1. **Perceive** (Industrial cameras, depth sensors, point clouds with OpenCV, Open3D, RealSense, CubeEye, SensoPart)
  2. **Plan & Simulate** (DH/MDH parameters, Stäubli Robotics Suite, ROS, Gazebo, RViz, RoboDK)
  3. **Deploy & Validate** (Workspace validation, safety envelopes, repeatability testing, and commissioning documentation)

### 👔 Recruiter Mode Dossier
- **Fast-Track Executive Summary**: A dedicated view designed for technical recruiters and hiring managers containing quick facts, core technical competencies, career timeline, education, and language proficiencies.

### 📄 In-Browser Interactive CV Viewer
- **High-Fidelity Document Viewer**: Direct two-page CV inspection inside a clean overlay with instant PDF download functionality.

### 🌐 Dual-Language Internationalization (i18n)
- Seamless real-time switching between **English (EN)** and **German (DE)** across the entire portfolio, case studies, interactive labs, and dossier summaries.

### ♿ Adaptive Performance & "Simple Mode"
- **Simple Mode Toggle**: One-click switch for visitors who prefer standard cursor interaction, disabled smooth scrolling, and reduced motion.
- **Hardware-Aware Throttling**: Auto-detects low-power devices, battery saver mode, and user accessibility preferences (`prefers-reduced-motion`) to scale down render intensity gracefully.

### 📬 Direct Secure Contact Terminal
- Integrated contact form with project category selectors (`Full-Time Role`, `Research Collab`, `Consulting`, `Speaking / Demo`, `Open Source`) and optional Formspree backend integration.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Core Framework** | React 18, TypeScript, Vite 6 |
| **Styling & Design** | Tailwind CSS v4, Custom CSS Variables, DM Mono, Bricolage Grotesque, Inter |
| **Animation & Physics** | Motion (Framer Motion v12), Lenis (smooth inertial scrolling) |
| **3D Rendering** | Custom lightweight 3D math & Canvas rasterizer (`src/app/components/robot3d/`) |
| **UI Components** | Radix UI primitives, Lucide Icons, Sonner notifications |
| **Tooling & Linter** | oxfmt, Vite Plugins, pnpm |

---

## 📂 Project Structure

```text
alphin-portfolio/
├── .figma/                     # Figma Make environment configuration & scripts
├── public/                     # Static assets
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── figma/          # Fallback image utilities
│   │   │   ├── robot3d/        # Custom 3D engine, matrix math & robot models
│   │   │   │   ├── engine.ts   # 3D vector, matrix & projection math pipeline
│   │   │   │   └── robots.tsx  # Preloader3D, RobotShowcase & RobotHead models
│   │   │   ├── ui/             # Radix & customized UI component library
│   │   │   ├── contact.tsx     # Contact form, direct inquiry terminal & footer
│   │   │   ├── fx.tsx          # Custom cursor, robot buddy, gears, radar & HUD effects
│   │   │   ├── hero.tsx        # Hero section with interactive 3D robot arm
│   │   │   ├── nav.tsx         # Navbar with language toggle & simple mode switch
│   │   │   ├── overlays.tsx    # Hire modal, CV viewer & Recruiter Mode dossier
│   │   │   └── sections.tsx    # WorkSection, KinematicsLab, Skills, SystemsLab & Timeline
│   │   ├── config.ts           # Site configuration (domain, formspree, analytics)
│   │   ├── i18n.ts             # English & German dictionary and translation helpers
│   │   ├── lib.ts              # Global state, projects data, skills & performance flags
│   │   ├── services.ts         # Contact form submission and analytics adapters
│   │   └── App.tsx             # Main application orchestrator & theme setup
│   ├── imports/                # Project media, CV assets and photography
│   ├── styles/                 # Fonts, Tailwind and typography styling
│   └── main.tsx                # Application entry point
├── package.json                # Project dependencies and build scripts
├── tsconfig.json               # TypeScript compiler configuration
├── vite.config.ts              # Vite bundler configuration
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [pnpm](https://pnpm.io/) (version 8+ or `corepack enable pnpm`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Allen73737/alphin-portfolio-web.git
   cd alphin-portfolio-web
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start the local development server:**
   ```bash
   pnpm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173` (or the port specified in terminal).

### Available Scripts

- `pnpm run dev` — Starts the development server with Hot Module Replacement (HMR).
- `pnpm run build` — Compiles TypeScript and builds the production bundle into `/dist`.
- `pnpm run preview` — Locally previews the production build.
- `pnpm run format` — Formats source files using `oxfmt`.

---

## ⚙️ Configuration

Site-wide options can be configured in [src/app/config.ts](file:///C:/My_Project/alphin-portfolio/src/app/config.ts):

```typescript
export const SITE = {
  /* Public URL once deployed (used for meta link previews) */
  url: "https://your-domain.com",

  /* Formspree form ID for contact submissions (leave empty for mailto fallback) */
  formspreeId: "",

  /* Privacy-friendly analytics (Plausible or Umami) */
  analytics: {
    provider: "" as "" | "plausible" | "umami",
    domain: "",
    websiteId: "",
    scriptSrc: "",
  },
};
```

---

## 👤 About the Engineer

**Alphin Francis**  
*Robotics & Automation Engineer*  
- **Education:** M.Sc. Automation & Robotics, TU Dortmund · B.Tech Mechatronics Engineering
- **Specializations:** Industrial Robotics (Universal Robots, Stäubli), Computer Vision, Robot Kinematics, Mobile Manipulation, ROS/Gazebo Simulation
- **Location:** Leverkusen / Dortmund, Germany
- **LinkedIn:** [linkedin.com/in/alphin-francis](https://www.linkedin.com/in/alphin-francis)
- **Email:** [alphinfrancis7@gmail.com](mailto:alphinfrancis7@gmail.com)

---

## 📄 License

This project is personal portfolio work created by [Alphin Francis](https://github.com/Allen73737). All rights reserved.
