import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const { name, email, password } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const data = await registerUser(formData);

      localStorage.setItem(
        "user",
        JSON.stringify(data)
      );

      alert("Registration Successful");

      navigate("/dashboard");
    } catch (error) {
      alert("Registration Failed");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow p-4">
            <h3 className="text-center mb-4">
              Register
            </h3>

            <form onSubmit={handleRegister}>
              <input
                type="text"
                className="form-control mb-3"
                placeholder="Enter name"
                name="name"
                value={name}
                onChange={handleChange}
              />

              <input
                type="email"
                className="form-control mb-3"
                placeholder="Enter email"
                name="email"
                value={email}
                onChange={handleChange}
              />

              <input
                type="password"
                className="form-control mb-3"
                placeholder="Enter password"
                name="password"
                value={password}
                onChange={handleChange}
              />

              <button
                className="btn btn-success w-100"
                type="submit"
              >
                Register
              </button>
            </form>

            <p className="text-center mt-3">
              Already have an account?{" "}
              <Link to="/">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;