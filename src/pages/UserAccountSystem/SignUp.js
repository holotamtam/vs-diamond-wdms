import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SignUp = () => {

  //variables
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate(-1)}>Back</button>
      
          <h2>Select Role:</h2>
          <Link to="/SignUpDentistOwner"><button>Personnel</button></Link>
          <Link to="/SignUpPatient"><button>Patient</button></Link>
    </div>
  );
};

export default SignUp;