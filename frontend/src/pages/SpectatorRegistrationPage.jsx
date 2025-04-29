import { useState, useRef, useEffect } from "react";
import spectatorService from "../services/spectatorService";
import { useToast } from "../hooks/toast-messages/useToast";
import { useAuth } from "../hooks/useAuth";
import cc from "../utils/cc";
import { useQuery, useMutation } from "@tanstack/react-query";
import LoadingScreen from "../components/LoadingScreen";
import { useSearchParams } from "react-router-dom";
import EmailTooltip from "../components/registration/RegistrationEmailTooltip";


// TODO: Sivulle pääsee vain linkinkautta, jossa aktiivinen token mukana
// TODO: Email pitää vaihtaa tokenissa tulleen sähköpostin mukaan, eikä tätä pitäisi pystyä muuttamaan
const SpectatorRegistrationPage = () => {
  const { addToast } = useToast();
  const { login } = useAuth();
  const [errors, setErrors] = useState({ email: { value: "success" } });
  let [searchParams, setSearchParams] = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email") || ""; // Default to empty string if no email in params

  // Set initial state with email from search params
  const [registrationData, setRegistrationData] = useState({
    email: email, // Use email from URL if available
    password: "",
    passwordAgain: "",
    firstName: "",
    lastName: "",
  });

  const registerSpectator = useMutation({
    mutationFn: (newRegistrationData) =>
      spectatorService.registerSpectator(newRegistrationData),
    onError: (error) => {
      console.error("Error registering spectator:", error);
      addToast("Virhe rekisteröitäessä käyttäjää", { style: "error" });
    },
    onSuccess: (user) => {
      addToast("Käyttäjä rekisteröity", { style: "success" });
      login(user);
    },
  });
  
  const changeHandler = (e) => {
    const { name, value } = e.target;
    setRegistrationData({
      ...registrationData,
      [name]: value,
    });
  };

  const checkForEmptyFields = () => {
    const generateErrorMessage = (field, message) => {
      const value =
        registrationData[field] === "" || registrationData[field] === null
          ? "error"
          : "success";
      const existingError = errors[field];
      const errorMessage =
        registrationData[field] === "" || registrationData[field] === null
          ? message
          : existingError
            ? existingError.message
            : "";
      return {
        value: existingError ? existingError.value : value,
        message: errorMessage,
      };
    };

    setErrors({
      firstName: generateErrorMessage("firstName", "Täytä tämä kenttä"),
      lastName: generateErrorMessage("lastName", "Täytä tämä kenttä"),
      password: generateErrorMessage("password", "Täytä tämä kenttä"),
      passwordAgain: generateErrorMessage("passwordAgain", "Täytä tämä kenttä"),
    });
  };

  const errorCheckRegistration = () => {
    let isValid = true;

    const checkForEmptyFieldsOnRegister = () => {
      let isValid = true;
      for (const field in registrationData) {
        if (
          registrationData[field] === "" ||
          registrationData[field] === null
        ) {
          isValid = false;
          break;
        }
      }
      return isValid;
    };

    //TODO: Create separate error checking functions for each field
    errorCheckSimpleInput(registrationData.firstName, "firstName");
    errorCheckSimpleInput(registrationData.lastName, "lastName");
    errorCheckPasswords();
    checkForEmptyFields();

    isValid = checkForEmptyFieldsOnRegister();

    for (const field in errors) {
      if (errors[field].value !== "success") {
        isValid = false;
        break;
      }
    }
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!errorCheckRegistration()) {
      return;
    }
    const registrationDataToSend = {
      token: token,
      email: registrationData.email,
      password: registrationData.password,
      firstName: registrationData.firstName,
      lastName: registrationData.lastName, 
    }
    try {
      registerSpectator.mutate(registrationDataToSend);
    } catch (error) {
      console.error("Error adding journal entry:", error);
    }
    ;
  };

  const errorCheckSimpleInput = (fieldValue, fieldName) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      if (fieldValue === "") {
        newErrors[fieldName] = {
          value: "error",
        };
      } else {
        // Only set to success if the field passes all checks
        newErrors[fieldName] = {
          value: "success",
        };
      }
      return newErrors;
    });
  };

  const errorCheckPasswords = () => {
    setErrors((prev) => {
      const next = { ...prev };
      const { password, passwordAgain } = registrationData;

      // password regex
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!password) {
        next.password = { value: "error", message: "Täytä tämä kenttä" };
      } else if (!passwordRegex.test(password)) {
        next.password = {
          value: "error",
          message:
            "Salasanan tulee olla vähintään 8 merkkiä pitkä ja sisältää vähintään yhden ison kirjaimen sekä numeron",
        };
      } else {
        next.password = { value: "success" };
      }

      // confirm password
      if (!passwordAgain) {
        next.passwordAgain = { value: "error", message: "Täytä tämä kenttä" };
      } else if (password !== passwordAgain) {
        next.passwordAgain = {
          value: "error",
          message: "Salasanat eivät täsmää",
        };
      } else {
        next.passwordAgain = { value: "success" };
      }
      return next;
    });
  };

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false; //skip the initial mount
      return;
    }
    errorCheckPasswords();
  }, [registrationData.password, registrationData.passwordAgain]);

  const containerClass = "flex flex-col gap-1 relative";
    //add absolute to errorClass to make it look better, but
  //beware long error messages (minimum password length etc) will overlap
  //with the input field below the it.
  const errorClass = "text-red-500 mt-1"; 

  const inputClass =
    "text-lg text-textPrimary border-borderPrimary h-10 w-full r border-b p-1 pl-0 bg-bgSecondary focus-visible:outline-none focus-visible:border-primaryColor";

  const disabledInputClass =
    "text-lg text-textPrimary border-borderPrimary rounded-t-lg h-10 w-full r border-b p-1 pl-0 text-opacity-40 bg-bgPrimary focus-visible:outline-none focus-visible:border-primaryColor";

  return (
    <div className="grid w-screen h-screen border-none bg-bgPrimary text-textPrimary place-items-center">
      <div
        className="bg-bgSecondary border-borderPrimary flex h-full  w-full sm:max-w-[600px]
       flex-col self-center border shadow-md min-h-max sm:h-[max-content] sm:rounded-md overflow-y-auto"
      >
        <div className="relative p-5 text-xl text-center text-white border-b shadow-md bg-primaryColor border-borderPrimary sm:rounded-t-md">
          <p>Vierailijaksi rekisteröityminen</p>
        </div>
        <form
          className="grid w-full grid-cols-1 gap-8 p-8 sm:p-12 sm:gap-12 sm:grid-cols-regGrid"
          onSubmit={handleSubmit}
        >
          {/* First Name */}
          <div className={containerClass}>
            <input
              onChange={changeHandler}
              type="text"
              name="firstName"
              id="first-name-input"
              placeholder="Etunimi"
              value={registrationData.firstName}
              className={
                inputClass +
                (errors.firstName && errors.firstName.value
                  ? errors.firstName.value === "error"
                    ? " border-red-500"
                    : errors.firstName.value === "success"
                      ? " border-green-500"
                      : ""
                  : "")
              }
              onBlur={() => {
                errorCheckSimpleInput(registrationData.firstName, "firstName");
              }}
            />
            {errors.firstName && errors.firstName.message && (
              <p className={errorClass}>{errors.firstName.message}</p>
            )}
          </div>

          {/* Last name */}
          <div className={containerClass}>
            <input
              onChange={changeHandler}
              type="text"
              name="lastName"
              id="last-name-input"
              placeholder="Sukunimi"
              className={
                inputClass +
                (errors.lastName && errors.lastName.value
                  ? errors.lastName.value === "error"
                    ? " border-red-500"
                    : errors.lastName.value === "success"
                      ? " border-green-500"
                      : ""
                  : "")
              }
              value={registrationData.lastName}
              onBlur={() => {
                errorCheckSimpleInput(registrationData.lastName, "lastName");
              }}
            />
            {errors.lastName && errors.lastName.message && (
              <p className={errorClass}>{errors.lastName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="relative flex flex-col gap-1 text-opacity-70 sm:col-span-2">
            <input
              disabled
              type="email"
              name="email"
              id="email-input"
              value={email}
              placeholder="Vierailijan@sähköposti.fi"
              onChange={(e) => {
                setRegistrationData({
                  ...registrationData,
                  email: e.target.value,
                });
              }}
              className={cc(
                disabledInputClass,
                errors.email && errors.email.value
                  ? errors.email.value === "error"
                    ? " border-red-500"
                    : errors.email.value === "success"
                      ? " border-green-500"
                      : ""
                  : ""
              )}
            />
          </div>

          {/* Password */}
          <div className={containerClass}>
            <input
              onChange={changeHandler}
              type="password"
              name="password"
              id="password-input"
              placeholder="Salasana"
              className={
                inputClass +
                (errors.password && errors.password.value
                  ? errors.password.value === "error"
                    ? " border-red-500"
                    : errors.password.value === "success"
                      ? " border-green-500"
                      : ""
                  : "")
              }
              value={registrationData.password}
              onBlur={errorCheckPasswords}
            />
            {errors.password && errors.password.message && (
              <p className={errorClass}>{errors.password.message}</p>
            )}
          </div>

          {/* Password Repeat */}
          <div className={containerClass}>
            <input
              onChange={changeHandler}
              type="password"
              name="passwordAgain"
              id="password-input-2"
              placeholder="Salasana uudelleen"
              className={
                inputClass +
                (errors.passwordAgain && errors.passwordAgain.value
                  ? errors.passwordAgain.value === "error"
                    ? " border-red-500"
                    : errors.passwordAgain.value === "success"
                      ? " border-green-500"
                      : ""
                  : "")
              }
              value={registrationData.passwordAgain}
              onBlur={errorCheckPasswords}
            />
            {errors.passwordAgain && errors.passwordAgain.message && (
              <p className={errorClass}>{errors.passwordAgain.message}</p>
            )}
          </div>

          {/* TODO: Button to the center of the 2 cols when in sm:  */}
          <div className="flex flex-col justify-center w-full mb-8 sm:col-span-2">
            <button
              className="w-40 h-12 px-4 py-2 m-auto text-white duration-75 border-2 rounded-md cursor-pointer border-borderPrimary bg-primaryColor hover:bg-hoverPrimary active:scale-95"
              type="submit"
            >
              Rekisteröidy
            </button>
            <a
              className="m-auto mt-2 text-sm underline"
              href="https://urheilupaivakirja.tiipar.treok.io/gdpr_urheilupaivakirja.pdf"
            >
              Tietosuojaseloste
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpectatorRegistrationPage;
