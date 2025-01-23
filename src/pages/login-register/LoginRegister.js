import React from "react";
import "./LoginRegister.css";
import { FaUser, FaLock} from "react-icons/fa";
import logo from "../../assets/login-register/logo.png";
import personnel from "../../assets/login-register/personnel.png";
import patient from "../../assets/login-register/patient.png";
import { Link } from "react-router-dom";

const LoginRegister = () => {

    return (
        <div className="login-wrapper">
            <div className="left-navbar">
                <center>
                    <div className="logo-container">
                        <img src={logo} className="logo" alt="heaves"/>
                    </div>
                </center>

                <div className="form-box login">
                    <form action="">
                        <h1>Welcome Back!</h1>
                        <h4>Start smiling bright like a Diamond with us!</h4>
                        <center>
                        <div className="input-box">
                            <input type="email" placeholder='Email Address' required />
                            <FaUser className="icon"/>
                        </div>
                        <div className="input-box">
                            <input type="password" placeholder='Password' required />
                            <FaLock className="icon"/>
                        </div>
                        <div className="remember-forgot">
                            <Link to="/Recovery">Forgot Password?</Link>
                        </div>
                        </center>

                        <button type="submit">Login</button>

                    </form>
                </div>
            </div>

            <div className="right-navbar">
                <div className="header">
                    <h1>Create Account</h1>
                    <h4>Choose which one are you.</h4>
                </div>

                <div className="choices">
                        <Link to="/Personnel">
                            <img src={personnel} className="personnel"/>
                        </Link>
                        <Link to="/Patient">
                            <img src={patient} className="patient"/>
                        </Link>
                </div>

                <div className="footer">
                    <label className="about">
                        <Link to="/About">ABOUT US</Link>
                    </label>
                    <label className="contact">
                        <Link to="/Contact">CONTACT US</Link>
                    </label>
                    <label className="faqs">
                        <Link to="/Home">FAQS</Link>
                    </label>
                </div>
            </div>
        </div>

    );
};

export default LoginRegister;