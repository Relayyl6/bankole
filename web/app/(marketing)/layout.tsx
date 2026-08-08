import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="light-theme">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
