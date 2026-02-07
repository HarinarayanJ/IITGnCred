import React from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const ShowMnemonic = ({ mnemonic }) => {
  const handleClick = () => {
    Swal.fire({
      title: "Your Mnemonic",
      html: `<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; text-align:center;">
        ${mnemonic.split(" ").map(word => `<div style="padding:5px 10px; background:#f1f1f1; border-radius:6px;">${word}</div>`).join("")}
      </div>`,
      confirmButtonText: "Close",
      width: '500px',
    });
  };

  return (
    <button onClick={handleClick}>
      Show Mnemonic
    </button>
  );
};

export default ShowMnemonic;