<div align="center">
  <img src="src/assets/OnlyEyesSnapProof.png" alt="SnapProof Logo" width="120" />
  <h1>SnapProof</h1>
  <p><strong>Professional Evidence Capture & Reporting Tool</strong></p>

  [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
  [![Electron](https://img.shields.io/badge/Electron-v29-47848F.svg)](https://www.electronjs.org/)
  [![React](https://img.shields.io/badge/React-v18-61DAFB.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178C6.svg)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3-38B2AC.svg)](https://tailwindcss.com/)

  <br />
</div>

---

## 📸 Overview

**SnapProof** is a desktop application designed solely for capturing, editing, and organizing screenshot evidence. Built with a focus on speed and reliability, it allows users to create professional reports from their captured workflows in seconds.

Featuring the **Liquid Glass Design System**, SnapProof offers a premium, modern interface that is both beautiful and highly functional, with glassmorphism effects, smooth animations, and a focus on user experience.


---

## 💡 Motivation

This initiative is simple but incredibly useful for my daily workflow. Ultimately, this is a completely personal project designed to effectively report my User Stories to the testing team while keeping a record of what interests me most. Built purely for the joy of coding and tailored specifically to my needs, I have thoroughly enjoyed the process of researching and implementing best practices for Electron Apps and UI/UX design.

---

## ✨ Key Features

### 🚀 Smart Capture
-   **Instant Region Capture**: Press `Ctrl+Shift+1` anywhere to capture a specific region.
-   **Auto-Naming & Metadata**: Add titles and descriptions immediately after capture.
-   **Live Preview**: Review your capture instantly without leaving your workflow.

### 🎨 Powerful Image Editor
-   **Annotation Tools**: Add rectangles, circles, text, and arrows to highlight key areas.
-   **Direct Metadata Editing**: Edit the capture title and description directly within the editor.
-   **Non-Destructive**: Original captures are preserved until you save your edits.

### 🌊 Liquid Glass Design
-   **Modern Aesthetics**: Apple-inspired design with frosted glass accents and fluid animations.
-   **Dark & Light Mode**: Seamless switching between themes with semantic color variables.
-   **Responsive Layouts**: Adaptive grid views and layout transitions powered by **Framer Motion**.

### ⚡ Flows & Organization
-   **Capture Flows**: Group related screenshots into logical "Flows" for step-by-step documentation.
-   **Recents Gallery**: A virtualized, high-performance gallery to browse your capture history.
-   **Smart Filtering**: Filter by date, status (Success/Failure), and search by content.

### 📝 Professional Reporting
-   **Report Wizard**: comprehensive tool to generate PDF or DOCX reports.
-   **Templates**: customizable templates for different reporting needs.
-   **Export**: Export your evidence flows into professional documents with a single click.

---

## 🛠️ Tech Stack

-   **Core**: [Electron](https://www.electronjs.org/), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/), CSS Modules, Framer Motion
-   **Canvas Engine**: [Fabric.js](http://fabricjs.com/) (for Image Editor)
-   **Persistence**: [Electron Store](https://github.com/sindresorhus/electron-store)

---

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18 or higher)
-   npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/snapproof.git
    cd snapproof
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

### Development

Run the application in development mode with hot-reloading:

```bash
npm run electron:dev
```

### Build

Create a production-ready executable:

```bash
npm run build
```

---

## ⌨️ Shortcuts

| Action | Windows | Mac |
| :--- | :--- | :--- |
| **Region Capture** | `Ctrl` + `Shift` + `1` | `Cmd` + `Shift` + `1` |
| **Quick Flow Mode** | `Ctrl` + `Shift` + `F` | `Cmd` + `Shift` + `F` |
| **Developer Tools** | `Ctrl` + `Shift` + `I` | `Cmd` + `Option` + `I` |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

<div align="center">
  <p>Built with ❤️ by the SnapProof Team</p>
</div>
