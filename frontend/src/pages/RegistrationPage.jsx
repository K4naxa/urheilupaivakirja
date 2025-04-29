import { useState, useRef, useEffect } from "react";

import registerService from "../services/registerService";
import miscService from "../services/miscService";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useToast } from "../hooks/toast-messages/useToast";
import { useAuth } from "../hooks/useAuth";
import GroupSelect from "../components/registration/RegistrationGroupSelect";
import CampusSelect from "../components/registration/RegistrationCampusSelect";
import SportSelect from "../components/registration/RegistrationSportSelect";
import userService from "../services/userService";
import { useNavigate } from "react-router-dom";
import EmailTooltip from "../components/registration/RegistrationEmailTooltip";

const RegistrationPage = () => {
  const [registrationData, setRegistrationData] = useState({
    email: "",
    password: "",
    passwordAgain: "",
    firstName: "",
    lastName: "",
    sportId: null,
    groupId: null,
    campusId: null,
  });
  const [options, setOptions] = useState({
    student_groups: [],
    sports: [],
    campuses: [],
  });
  const [errors, setErrors] = useState({});
  const { addToast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  //inputRef = useRef(null);

  // fetch options for registration form
  useEffect(() => {
    const fetchData = async () => {
      try {
        const optionsData = await miscService.getGroupsSportsCampusesOptions();
        setOptions(optionsData);
      } catch (error) {
        console.error("Failed to fetch options:", error);
      }
    };

    fetchData();
  }, []);

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
      email: generateErrorMessage("email", "Täytä tämä kenttä"),
      password: generateErrorMessage("password", "Täytä tämä kenttä"),
      passwordAgain: generateErrorMessage("passwordAgain", "Täytä tämä kenttä"),
      sportId: generateErrorMessage("sportId", "Valitse laji"),
      groupId: generateErrorMessage("groupId", "Valitse ryhmä"),
      campusId: generateErrorMessage("campusId", "Valitse toimipaikka"),
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
    errorCheckEmail();
    errorCheckPasswords(); // errorcheck for both passwords
    errorCheckDropdown(registrationData.sportId, "sportId");
    errorCheckDropdown(registrationData.groupId, "groupId");
    errorCheckDropdown(registrationData.campusId, "campusId");

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

  //TODO: KORJAA
  const registerHandler = async (e) => {
    e.preventDefault();

    if (!errorCheckRegistration()) {
      return;
    }

    try {
      // Attempt to register the user
      await registerService.register(
        registrationData.email,
        registrationData.password,
        registrationData.firstName,
        registrationData.lastName,
        registrationData.sportId,
        registrationData.groupId,
        registrationData.campusId
      );

      // If registration is successful, show a success message
      addToast("Käyttäjätunnus luotu", { style: "success" });

      try {
        const user = await userService.login(
          registrationData.email,
          registrationData.password
        );
        login(user);
      } catch (loginError) {
        addToast("Kirjautuminen epäonnistui", {
          style: "error",
          autoDismiss: false,
        });
        console.error("Error logging in:", loginError);
      }
    } catch (registrationError) {
      addToast("Rekisteröityminen epäonnistui", {
        style: "error",
        autoDismiss: false,
      });
    }
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

  // reset email errors and check if email is valid
  const errorCheckEmail = () => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      const emailRegEx = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g;

      if (registrationData.email.length < 1) {
        newErrors.email = {
          value: "error",
        };
      } else if (!emailRegEx.test(registrationData.email)) {
        newErrors.email = {
          value: "error",
          message: "Sähköposti ei ole oikeassa muodossa",
        };
      } else {
        // Successfully validate the email
        newErrors.email = {
          value: "success",
        };
      }

      return newErrors;
    });
  };

  // reset password errors and check if password is valid
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

  // run after every keystroke
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false; //skip the initial mount
      return;
    }
    errorCheckPasswords();
  }, [registrationData.password, registrationData.passwordAgain]);

  const errorCheckDropdown = (fieldValue, fieldName) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      // Assume that an empty string or a specific default value indicates no valid selection
      if (fieldValue === "" || fieldValue === "default") {
        newErrors[fieldName] = {
          value: "error",
          message: "Valitse vaihtoehto",
        };
      } else {
        // If a valid option is selected, mark it as successful
        newErrors[fieldName] = {
          value: "success",
        };
      }

      return newErrors;
    });
  };

  const handleDropdownChange = (event) => {
    const { name, value } = event.target;
    setRegistrationData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    errorCheckDropdown(value, name);
  };

  const containerClass = "flex flex-col gap-1 relative";
  const dropdownContainerClass =
    "flex flex-col gap-1 mb-4 sm:mb-0 relative bg-bgSecondary ";

  //add absolute to errorClass to make it look better, but
  //beware long error messages (minimum password length etc) will overlap
  //with the input field below the it.
  const errorClass = "text-red-500 mt-1";

  const inputClass =
    "text-lg text-textPrimary border-borderPrimary h-10 w-full r border-b p-1 pl-0 bg-bgSecondary focus-visible:outline-none focus-visible:border-primaryColor";

  return (
    <div className="grid w-screen border-none min-h-dvh bg-bgPrimary text-textPrimary place-items-center">
      <div
        className="bg-bgSecondary border-borderPrimary flex h-full w-full sm:max-w-[600px]
       flex-col self-center sm:border shadow-md min-h-max sm:h-[max-content] sm:rounded-md overflow-y-auto"
      >
        <div
          /* safe-area-inset should help with mobile OS top bar and bottom buttons*/
          className="relative flex h-16 items-center justify-center
             border-b border-borderPrimary bg-primaryColor text-xl text-white
             shadow-md sm:rounded-t-md pt-[env(safe-area-inset-top)]"
        >
          <Link
            to="/LoginPage"
            className="absolute text-3xl -translate-y-1/2 left-5 top-1/2"
          >
            <FiArrowLeft />
          </Link>

          <span>Rekisteröityminen</span>
        </div>
        <form
          className="grid w-full grid-cols-1 gap-6 p-8 sm:p-12 sm:gap-12 sm:grid-cols-regGrid"
          onSubmit={registerHandler}
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
          <div className="relative flex flex-col gap-1 sm:col-span-2 ">
            <input
              onChange={changeHandler}
              type="email"
              name="email"
              id="email-input"
              placeholder="etu.sukunimi@edu.tampere.fi"
              className={
                inputClass +
                (errors.email && errors.email.value
                  ? errors.email.value === "error"
                    ? " border-red-500"
                    : errors.email.value === "success"
                      ? " border-green-500"
                      : ""
                  : "")
              }
              value={registrationData.email}
              onBlur={() => {
                errorCheckEmail();
              }}
            />
            {errors.email && errors.email.message && (
              <p className={errorClass}>{errors.email.message}</p>
            )}
            <div className="absolute transform -translate-y-1/2 right-2 top-1/2">
              <EmailTooltip />
            </div>
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
          <div className={`${containerClass} mb-4 sm:mb-0`}>
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
          {/* Sport */}
          <div className={dropdownContainerClass}>
            <SportSelect
              inputClass="input-class"
              errorClass="error-class"
              errors={errors}
              registrationData={registrationData}
              options={options}
              handleDropdownChange={(event) => handleDropdownChange(event)}
            />

            {/* example error messages for group, campus and sport. */}
            {/* 
            errors.sportId && errors.sportId.message && (
              <p className={errorClass}>{errors.sportId.message}</p>
            )*/}
          </div>

          {/* Group */}
          <div className={dropdownContainerClass}>
            <GroupSelect
              inputClass="input-class"
              errorClass="error-class"
              errors={errors}
              registrationData={registrationData}
              options={options}
              handleDropdownChange={(event) => handleDropdownChange(event)}
            />
          </div>

          {/* Campus */}
          <div className={dropdownContainerClass}>
            <CampusSelect
              inputClass="input-class"
              errorClass="error-class"
              errors={errors}
              registrationData={registrationData}
              options={options}
              handleDropdownChange={(event) => handleDropdownChange(event)}
            />
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

export default RegistrationPage;
