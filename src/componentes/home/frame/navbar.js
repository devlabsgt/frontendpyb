import React from 'react';
function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark fixed-top"
     style={{backgroundColor: "#1a1d23", opacity:  0.8}}>


      <div className="container">
        <a className="navbar-brand" href="/">Fundación Paz y Bien</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#basicExampleNav"
          aria-controls="basicExampleNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="basicExampleNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a className="nav-link" href="#inicio">Inicio</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#aboutus">Nosotros</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#gallery">Proyectos</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#contact">Contacto</a>
            </li>
          </ul>
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" href="https://www.facebook.com/GuatemalaPazyBien" target="_blank" rel="noreferrer">
                <i className="bi bi-facebook"></i>
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="https://www.youtube.com/channel/UCI5fKlbayi8hQGOGroqbOhQ/videos" target="_blank" rel="noreferrer">
                <i className="bi bi-youtube"></i>
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="https://www.ivoox.com/podcast-asociacion-paz-bien_sq_f1472067_1.html" target="_blank" rel="noreferrer">
                <i className="bi bi-broadcast"></i>
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="https://twitter.com/tucuentasguatem" target="_blank" rel="noreferrer">
                <i className="bi bi-twitter"></i>
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/inicio">Ingresar</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );  
}

export default Navbar;
