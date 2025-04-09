import React from "react";
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div>
      <title>VSDiamond Dental Clinic | Index</title>
    
      <Link to="/Services"><button>View Our Services</button></Link>
      <button>Dental Portfolio</button>

      <Link to="/SignIn"><button>Sign In</button></Link>

      <Link to="/SignUp"><button>Sign Up</button></Link>

  
    </div>
  )
}

export default Index;