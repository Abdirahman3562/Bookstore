import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";

export default function AdPopup() {
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShow(true);
      setTimeout(() => setAnimate(true), 50); // start animation
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  const closePopup = () => {
    setAnimate(false);
    setTimeout(() => setShow(false), 300);
  };

  if (!show) return null;

  return (
    <div style={styles.overlay}>
      <div
        style={{
          ...styles.popup,
          transform: animate ? "scale(1)" : "scale(0.7)",
          opacity: animate ? 1 : 0,
          transition: "all 0.35s ease",
        }}
      >
        <IoClose
          size={26}
          onClick={closePopup}
          style={styles.closeIcon}
        />

        <h2 style={{ marginBottom: "8px" }}>Qiimo Dhimis 🔥</h2>
        <p style={{ fontSize: "15px" }}>
          Buugaag cusub ayaa la soo kordhiyey!  
          <br />
          Ka faa’iidayso maanta!
        </p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
  },

  popup: {
    width: "330px",
    padding: "25px 20px",
    borderRadius: "18px",

    // 🧊 Glass Effect
    background: "rgba(255, 255, 255, 0.16)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.3)",
    backdropFilter: "blur(14px)",

    textAlign: "center",
    color: "#fff",
    position: "relative",
  },

  closeIcon: {
    position: "absolute",
    top: "12px",
    right: "12px",
    cursor: "pointer",
    color: "white",
    opacity: 0.8,
  },
};
