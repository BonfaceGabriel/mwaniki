import React from "react";
import "./FlyingDoves.css"; // We will create this CSS file next

const FlyingDoves: React.FC = () => {
  const doves = Array.from({ length: 5 }).map((_, i) => (
    <div
      key={i}
      className="flying-dove"
      style={{
        animationDelay: `${i * 2}s`,
        left: `${Math.random() * 100}vw`,
        top: `${Math.random() * 100}vh`,
      }}
    >
      🕊️
    </div>
  ));

  return <div className="flying-doves-container">{doves}</div>;
};

export default FlyingDoves;
