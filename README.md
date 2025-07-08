# ICP Scholar - Decentralized Education Platform

📚 **A blockchain-based education platform on ICP that connects learners with educators, offering tokenized incentives for course completion and peer-to-peer knowledge sharing.**

## Overview

ICP Scholar is a full-stack decentralized education platform built on the Internet Computer Protocol (ICP). It features a Rust-based backend with multiple canisters and a modern React.js frontend with Vite, providing a comprehensive learning ecosystem with blockchain-powered incentives.

## Features

### 👨‍🎓 For Students
- **Internet Identity Authentication**: Secure, privacy-focused login system
- **Course Enrollment**: Browse and enroll in blockchain-verified courses
- **Progress Tracking**: Real-time progress monitoring with section completion
- **Certificate Generation**: Downloadable PDF certificates upon course completion
- **Token Rewards**: Earn ICP Scholar tokens for successful course completion
- **Peer Interaction**: Tip helpful peers and participate in knowledge exchange

### 👩‍🏫 For Educators
- **Course Creation**: Create and manage courses with multiple sections
- **Content Management**: Upload and organize text-based course content
- **Student Analytics**: View enrollment numbers and student progress
- **Token Distribution**: Distribute rewards to successful students
- **Community Building**: Send announcements to enrolled students

### 🪙 Token System
- **Fungible Tokens**: ERC-20 like token system built on ICP
- **Completion Rewards**: Automated token distribution for course completion
- **Peer Tipping**: Tip system for valuable community contributions
- **Transaction History**: Complete record of all token transactions

### 🧠 Peer-to-Peer Learning
- **Knowledge Sharing**: Post notes, questions, and study tips
- **Community Interaction**: Q&A system with peer support
- **Incentivized Participation**: Token rewards for helpful contributions
- **Spam Prevention**: Built-in reporting and moderation features

## Technology Stack

### Backend (Rust Canisters)
- **student_canister**: User profiles, enrollments, progress tracking, certificates
- **course_canister**: Course management, content storage, educator functions
- **token_canister**: Token minting, transfers, balance management
- **peer_canister**: Peer-to-peer notes, Q&A, tipping system

### Frontend (React + Vite)
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **React Router**: Client-side routing
- **Heroicons**: Beautiful SVG icons
- **jsPDF**: PDF generation for certificates

### Blockchain Integration
- **Internet Computer Protocol (ICP)**: Decentralized hosting and computation
- **Internet Identity**: Secure authentication without passwords
- **Candid**: Interface definition language for canisters
- **ic-cdk**: Canister development kit for Rust

## Project Setup

### Prerequisites
- [DFX SDK](https://sdk.dfinity.org/) - Internet Computer development toolkit
- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Rust](https://rustup.rs/) - Systems programming language

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/icp-scholar.git
cd icp-scholar
```

2. **Start the Internet Computer local replica**
```bash
dfx start --background
```

3. **Deploy the canisters**
```bash
dfx deploy
```

4. **Generate canister bindings**
```bash
dfx generate
```

5. **Install frontend dependencies**
```bash
npm install
```

6. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Authentication

ICP Scholar uses **Internet Identity** for secure, passwordless authentication:

1. Click "Login" on the homepage
2. Choose "Create New" or "Already have an anchor?" on the Internet Identity page
3. Follow the prompts to create or access your Internet Identity
4. Grant permission to ICP Scholar
5. You'll be redirected to your dashboard

## How It Works

### Course System
1. **Educators** create courses with multiple text-based sections
2. **Students** browse published courses and enroll
3. Students read through course content and mark sections as complete
4. Upon completing all sections, students can download a verified certificate
5. **Token rewards** are automatically distributed upon course completion

### Token Economy
- Tokens are minted by educators or the admin canister
- Students earn tokens by completing courses
- Tokens can be used to tip helpful peers in the community
- All transactions are recorded on the blockchain for transparency

### Peer Learning
- Students can post questions, answers, study notes, and tips
- Community members can tip valuable contributions with tokens
- This creates an incentivized learning environment where knowledge sharing is rewarded

## API Endpoints

### Student Canister
- `create_student_profile(name, email, bio)`: Create user profile
- `enroll_in_course(course_id)`: Enroll in a course
- `mark_section_complete(course_id, section_id)`: Mark section as read
- `complete_course(course_id, course_title)`: Complete course and generate certificate
- `get_student_enrollments()`: Get user's course enrollments
- `get_student_certificates()`: Get user's certificates

### Course Canister
- `create_educator_profile(name, bio, expertise)`: Create educator profile
- `create_course(title, description, token_reward)`: Create new course
- `add_course_section(course_id, title, content)`: Add section to course
- `publish_course(course_id)`: Publish course for students
- `get_published_courses()`: Get all published courses

### Token Canister
- `mint_tokens(to, amount, memo)`: Mint new tokens
- `transfer_tokens(to, amount, memo)`: Transfer tokens
- `reward_course_completion(student, amount, course_id)`: Reward completion
- `tip_peer(to, amount, memo)`: Tip another user
- `get_balance(principal)`: Get token balance
- `get_transaction_history(principal)`: Get transaction history

### Peer Canister
- `create_peer_note(course_id, author_name, content, note_type)`: Create note
- `tip_peer_note(note_id, amount, message)`: Tip a note
- `get_course_notes(course_id)`: Get notes for a course
- `get_user_notes(principal)`: Get user's notes

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on the [Internet Computer](https://internetcomputer.org/)
- Uses [Internet Identity](https://identity.ic0.app/) for authentication
- Powered by [DFINITY](https://dfinity.org/) technology
- UI components from [Heroicons](https://heroicons.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

🚀 **Start your decentralized learning journey with ICP Scholar today!**