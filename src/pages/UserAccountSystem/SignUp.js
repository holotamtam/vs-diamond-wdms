import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SignUp = () => {

  //variables
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate(-1)}>Back</button>
      
          <h2>Select Role:</h2>
          <Link to="/sign-up-associatedentist"><button>Dentist</button></Link>
          <Link to="/sign-up-clinicstaff"><button>Personnel</button></Link>
          <Link to="/sign-up-patient"><button>Patient</button></Link>
    </div>
  );
};

export default SignUp;