# Script Runner

## Introduction

**Script Runner** is a full-stack web application designed to streamline the execution and management of multiple automation scripts from a single, unified interface. It enables users to easily run, monitor, and interact with various Python and Node.js scripts — including those that involve browser automation — without needing to manually open terminals or navigate to individual script files.

With Script Runner, users can:

- View all available scripts in a clean, organized sidebar menu.
- Access detailed pages for each script containing descriptions, a “Run Script” button, and a real-time terminal output panel.
- Monitor live console logs streamed directly from backend execution for full transparency.
- Track user activity through a dashboard showing script execution history, status, and duration.

This app is intended for deployment on a local network, allowing multiple users on connected devices to run scripts independently on their own machines. It simplifies complex automation workflows, improves productivity, and offers a modern, user-friendly UI built with React, TypeScript, Node.js, and Express.

---

## Features

- Multi-script management with clear UI navigation
- Real-time streaming of script logs to frontend terminal output
- User activity tracking dashboard
- Support for both Python and Node.js scripts
- Browser automation with interactive support on the user’s machine

---

## Technologies Used

- Frontend: React, TypeScript, CSS
- Backend: Node.js, Express
- Real-time communication: WebSockets or Server-Sent Events (SSE)
- Script execution: Child process management for Python and Node.js scripts

---

Feel free to contribute, report issues, or suggest features!
