import JoueurLayoutClient from "@/components/joueur/JoueurLayoutClient";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <JoueurLayoutClient>{children}</JoueurLayoutClient>;
}
