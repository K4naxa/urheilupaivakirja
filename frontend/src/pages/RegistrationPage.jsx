import { useState, useEffect } from "react";

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

  const [emailTooltipVisible, setEmailTooltipVisible] = useState(false);

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
    errorCheckPassword();
    errorCheckPasswordAgain();
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
  const errorCheckPassword = () => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      const password = registrationData.password;

      // Check if password is empty
      if (password.length < 1) {
        newErrors.password = {
          value: "error",
        };
      } else {
        // Regular expressions for validation
        const lengthCheck = /.{8,}/; // At least 8 characters
        const capitalLetterCheck = /[A-Z]/; // At least one uppercase letter
        const numberCheck = /[0-9]/; // At least one number

        // Check if the password meets the required conditions
        if (
          !lengthCheck.test(password) ||
          !capitalLetterCheck.test(password) ||
          !numberCheck.test(password)
        ) {
          newErrors.password = {
            value: "error",
            message:
              "Salasanan tulee olla vähintään 8 merkkiä pitkä ja sisältää vähintään yhden ison kirjaimen sekä numeron",
          };
        } else {
          newErrors.password = {
            value: "success",
          };
        }
      }

      // Revalidate passwordAgain if present
      if (registrationData.passwordAgain) {
        if (registrationData.password !== registrationData.passwordAgain) {
          newErrors.passwordAgain = {
            value: "error",
            message: "Salasanat eivät täsmää",
          };
        } else {
          newErrors.passwordAgain = {
            value: "success",
          };
        }
      } else {
        delete newErrors.passwordAgain;
      }

      return newErrors;
    });
  };

  const errorCheckPasswordAgain = () => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      const passwordAgain = registrationData.passwordAgain;

      if (passwordAgain.length < 1) {
        newErrors.passwordAgain = {
          value: "error",
        };
      } else if (registrationData.password !== passwordAgain) {
        newErrors.passwordAgain = {
          value: "error",
          message: "Salasanat eivät täsmää",
        };
      } else {
        newErrors.passwordAgain = {
          value: "success",
        };
      }

      // Ensure that password validation is in sync
      if (!registrationData.password || registrationData.password.length < 1) {
        newErrors.password = {
          value: "error",
        };
      } else {
        // Clear password error if already validated
        delete newErrors.password;
      }

      return newErrors;
    });
  };

  const errorCheckDropdown = (fieldValue, fieldName) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      // Assume that an empty string or a specific default value indicates no valid selection
      if (fieldValue === "" || fieldValue === "default") {
        newErrors[fieldName] = {
          value: "error",
          message: "Valitse vaihtoehto", // "Select an option" in Finnish
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
    <div className="grid w-screen h-screen border-none bg-bgPrimary text-textPrimary place-items-center">
      <div
        className="bg-bgSecondary border-borderPrimary flex h-full  w-full sm:max-w-[600px]
       flex-col self-center sm:border shadow-md min-h-max sm:h-[max-content] sm:rounded-md overflow-y-auto"
      >
        <div className="relative p-5 text-xl text-center text-white border-b shadow-md bg-primaryColor border-borderPrimary sm:rounded-t-md">
          <p>Rekisteröityminen</p>

          <Link
            to="/LoginPage"
            className="absolute text-3xl translate-y-1/2 bottom-1/2 left-5"
          >
            <FiArrowLeft />
          </Link>
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
              <div
                tabIndex="0"
                onMouseEnter={() => setEmailTooltipVisible(true)}
                onMouseLeave={() => setEmailTooltipVisible(false)}
                onClick={(e) => {
                  e.preventDefault();
                  setEmailTooltipVisible((prev) => !prev);
                }}
                onBlur={() => setEmailTooltipVisible(false)}
                className="flex items-center justify-center w-5 h-5 text-white border-2 rounded-full select-none border-primaryColor bg-primaryColor hover:bg-bgPrimary hover:text-primaryColor"
              >
                ?
              </div>
              {emailTooltipVisible && (
                <div className="absolute p-1 mr-2 text-sm transform -translate-y-1/2 border rounded right-full top-1/2 border-borderPrimary text-textPrimary bg-bgPrimary whitespace-nowrap">
                  Suosittelemme käyttämään
                  <br />
                  @edu.tampere.fi tai
                  <br />
                  @google.com -sähköpostiosoitetta
                </div>
              )}
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
              onBlur={() => errorCheckPassword()}
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
              onBlur={() => errorCheckPasswordAgain()}
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
