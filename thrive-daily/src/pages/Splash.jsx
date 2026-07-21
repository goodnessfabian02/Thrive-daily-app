import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import thriveLogo from "../assets/IMG_4137.jpeg"

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/", { replace: true })
    }, 2500)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="splash-screen">
      <img
        src={thriveLogo}
        alt="Thrive Daily"
        className="splash-logo"
      />

      <h1>Thrive Daily</h1>

      <p>Grow a little every day 🌱</p>
    </div>
  )
}
