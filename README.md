# KenRead - Next.js Manga Reader App

A modern manga reader application built with Next.js and Firebase, offering users a seamless experience to discover, read, and track their favorite manga titles through integration with the MangaDex API.

## Features

📚 **Manga Reading & Tracking**

- Comprehensive manga database via MangaDex API
- Personal bookmarks management
- Reading history tracking
- Chapter-by-chapter reading experience
- Responsive manga viewer

🔍 **Discovery System**

- Trending manga listings
- Latest updates
- Popular series
- Search functionality with filters
- Genre and tag-based browsing

👤 **User Management**

- Secure authentication system
- Profile customization
- Reading history
- Bookmarks synchronization
- Cross-device persistence

🎨 **Modern UI/UX**

- Responsive design for all devices
- Light/Dark theme support
- Sleek animations and transitions
- Chapter pagination
- Intuitive navigation

## Technical Stack

### Frontend

- Next.js for server-side rendering and static generation
- React for UI components
- Tailwind CSS for styling
- Shadcn UI component library
- Lucide React for icons

### Backend

- Firebase Authentication
- Cloud Firestore for data storage
- MangaDex API integration
- Zustand for state management
- Local storage for offline capabilities

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm, yarn, or pnpm
- Firebase account
- Git

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/kenread.git
```

2. Install dependencies

```bash
cd kenread
npm install
# or
yarn install
# or
pnpm install
```

3. Configure Firebase

- Create a new Firebase project
- Enable Authentication (Email/Password)
- Set up Cloud Firestore database
- Add your web app to Firebase

4. Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

5. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
src/
├── app/                  # Next.js app directory
│   ├── auth/             # Authentication pages
│   ├── bookmarks/        # Bookmarks page
│   ├── history/          # Reading history page
│   ├── manga/            # Manga details and reader
│   ├── search/           # Search functionality
│   └── page.tsx          # Homepage
├── components/           # React components
│   ├── auth/             # Auth-related components
│   ├── layout/           # Layout components (Navbar, Footer)
│   ├── ui/               # Reusable UI components
│   └── manga/            # Manga-specific components
├── contexts/             # React contexts
├── lib/                  # Utility functions and libraries
├── services/             # API and service integrations
│   ├── api/              # MangaDex API integration
│   └── firebase/         # Firebase services
├── store/                # Zustand stores
└── styles/               # Global styles
```

## Features in Detail

### Manga Reading Experience

- Chapter-by-chapter reading with pagination
- Responsive manga viewer optimized for all devices
- Reading progress tracking
- Chapter navigation and history

### Discovery Features

- Trending manga listings
- Latest updates
- Search with advanced filters
- Popular series recommendations

### User Features

- Email authentication
- Personal bookmarks collection
- Reading history tracking
- User preferences persistence
- Cross-device synchronization

## Deployment

The app can be easily deployed on Vercel:

1. Create a Vercel account and link your repository
2. Configure the environment variables
3. Deploy with a single click
4. Enjoy automatic deployments on commits

## API Integration

KenRead integrates with the MangaDex API to provide comprehensive manga data:

- **MangaDex API**: Primary source for manga information, chapters, and images
- **Custom API Wrappers**: Efficient data handling and error management
- **Caching Strategies**: Optimized loading times and reduced API calls

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [MangaDex](https://mangadex.org/) for their comprehensive manga API
- [Next.js](https://nextjs.org/) for the incredible React framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Firebase](https://firebase.google.com/) for backend services
- [Vercel](https://vercel.com/) for hosting and deployment
- All contributors who have helped improve this project
