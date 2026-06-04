import "./Footer.css";

export function Footer() {
  return (
    <footer className="c-footer">
      <div className="container c-footer-inner">
        <div>
          <div className="c-footer-brand">c1oud · mall</div>
          <p className="c-footer-tag">
            구름같이 가볍게 쇼핑하세요. PortOne V2로 안전결제.
          </p>
        </div>
        <div className="c-footer-meta">
          <span>© {new Date().getFullYear()} c1oud-mall</span>
          <span>API: localhost:8080</span>
        </div>
      </div>
    </footer>
  );
}
