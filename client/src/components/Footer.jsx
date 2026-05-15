import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export function Footer() {
  const { openSourceModal } = useApp();
  return (
    <footer>
      <div className="footer-top">
        <div>
          <p className="footer-brand">Scent Layer</p>
          <p className="footer-tagline">Curated fragrances for those who believe confidence starts with how you smell.</p>
        </div>
        <div className="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><Link to="/shop">All Fragrances</Link></li>
            <li><Link to="/shop?filter=niche">Niche</Link></li>
            <li><Link to="/shop?filter=designer">Designer</Link></li>
            <li><Link to="/shop#calc">Spray Calculator</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/explore">Top 10 Lists</Link></li>
            <li><Link to="/explore#occasions">Occasion Pairings</Link></li>
            <li><Link to="/explore#101">Fragrance 101</Link></li>
            <li><Link to="/about">About Scent Layer</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Tools</h4>
          <ul>
            <li><Link to="/tools">Layer Builder</Link></li>
            <li><Link to="/shop#finder">Scent Finder</Link></li>
            <li><Link to="/profile#personalize">Scent Quiz</Link></li>
            <li><Link to="/tools#compare">Compare</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-copy">© 2026 Scent Layer. All rights reserved.</p>
        <div className="footer-social">
          <a href="mailto:scentlayer@gmail.com">scentlayer@gmail.com</a>
          <a href="#" onClick={(e) => { e.preventDefault(); openSourceModal(''); }}>Source a Bottle</a>
          <a href="#">Instagram</a>
          <a href="#">TikTok</a>
        </div>
      </div>
    </footer>
  );
}
