import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SignUp = () => {

  // State variable for user role
  const [selectUser, setSelectUser] = useState(null);
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate(-1)}>Back</button>
      
          <h2>Select Role:</h2>



          <Link to="/SignUpPersonnel"><button>Personnel</button></Link>

          <Link to="/SignUpPatient"><button>Patient</button></Link>
    </div>
  );
};

export default SignUp;