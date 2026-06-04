import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, paddingBlock: "var(--c-sp-10)" }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
