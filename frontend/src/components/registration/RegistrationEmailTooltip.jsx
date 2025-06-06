import { useEffect, useRef, useState } from "react";

export default function EmailTooltip() {
  const [open, setOpen] = useState(false);
  const iconRef = useRef(null);

  //desktop
  const handlePointerEnter = (e) => {
    if (e.pointerType === "mouse") setOpen(true);
  };

  const handlePointerLeave = (e) => {
    if (e.pointerType === "mouse") setOpen(false);
  };

  //mobile
  const handlePointerDown = (e) => {
    if (e.pointerType !== "mouse") {
      e.preventDefault(); //stop the synthetic “hover”
      setOpen((v) => !v);
    }
  };

  // close on outside touch
  useEffect(() => {
    const close = (event) => {
      if (
        (event.pointerType && !iconRef.current?.contains(event.target))
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <div className="relative flex items-center">
      <div
        ref={iconRef}
        tabIndex={0}
        aria-describedby="email-tip"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        className="flex items-center justify-center w-5 h-5 text-white border-2 rounded-full select-none border-primaryColor bg-primaryColor hover:bg-bgPrimary hover:text-primaryColor focus:outline-none"
      >
        ?
      </div>

      {open && (
        <div
          id="email-tip"
          role="tooltip"
          className="absolute p-1 mr-2 text-sm transform -translate-y-1/2 border rounded right-full top-1/2 border-borderPrimary text-textPrimary bg-bgPrimary whitespace-nowrap"
        >
          Suosittelemme käyttämään
          <br />
          @edu.tampere.fi tai
          <br />
          @google.com -sähköpostiosoitetta
        </div>
      )}
    </div>
  );
}
