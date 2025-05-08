import React from "react";
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div>
      <title>VSDiamond Dental Clinic | Index</title>
    
      <Link to="/services"><button>View Our Services</button></Link>
      <button>Dental Portfolio</button>

      <Link to="/sign-in"><button>Sign In</button></Link>

      <Link to="/sign-up"><button>Sign Up</button></Link>

  
    </div>
  )
}

export default Index;