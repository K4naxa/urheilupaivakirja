import groupService from "../../../services/groupService";
import sportService from "../../../services/sportService";
import miscService from "../../../services/miscService";
import studentService from "../../../services/studentService";
import { FiTrash2, FiCheck } from "react-icons/fi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import LoadingScreen from "../../../components/LoadingScreen";
import { useToast } from "../../../hooks/toast-messages/useToast";
import dayjs from "dayjs";

const VerificationPage = () => {
  const {
    data: unverifiedData = { students: [], sports: [], student_groups: [] },
    isLoading,
    error,
  } = useQuery({
    queryKey: ["unverifiedStudentsSportsCampuses"],
    queryFn: miscService.getUnverifiedStudentsSportsCampuses,
  });

  const {
    students: unverifiedStudents = [],
    sports: unverifiedSports = [],
    student_groups: unverifiedStudentGroups = [],
  } = unverifiedData || {};

  function CreateStudentContainer({
    student,
    unverifiedSports,
    unverifiedStudentGroups,
  }) {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const verifyStudentMutation = useMutation({
      mutationFn: () => studentService.verifyStudent(student.user_id),
      onSuccess: () => {
        addToast("Oppilas hyväksytty", { style: "success" });
        queryClient.invalidateQueries({
          queryKey: ["unverifiedStudentsSportsCampuses"],
        });
        queryClient.invalidateQueries({ queryKey: ["StudentsList"] });
      },
      onError: (error) => {
        addToast("Virhe hyväksyttäessä oppilasta", { style: "error" });
        console.error("Error verifying student:", error);
      },
    });

    const deleteStudentMutation = useMutation({
      mutationFn: () => studentService.deleteStudent(student.user_id),
      onSuccess: () => {
        addToast("Oppilas poistettu", { style: "success" });
        queryClient.invalidateQueries({
          queryKey: ["unverifiedStudentsSportsCampuses"],
        });
      },
      onError: (error) => {
        addToast("Virhe poistettaessa oppilasta", { style: "error" });
        console.error("Error deleting student:", error);
      },
    });

    console.log(unverifiedStudentGroups, unverifiedSports);
    const sportConflict = unverifiedSports.some(
      (s) => s.name === student.sport
    );
    const groupConflict = unverifiedStudentGroups.some(
      (g) => g.name === student.group
    );
    const emailConflict = !student.email_verified;

    let verifyButtonTooltip = "";
    if (emailConflict) {
      verifyButtonTooltip = "Opiskelija ei ole vahvistanut sähköpostiosoitettaan";
    } else if (sportConflict || groupConflict) {
      verifyButtonTooltip = "Hyväksy ensin laji tai ryhmä";
    } else {
      verifyButtonTooltip = "Hyväksy";
    }

    return (
      <div
        key={student.id}
        className="relative flex flex-col gap-2 p-4 border rounded-md hover:bg-hoverDefault border-borderPrimary"
      >
        <div className="absolute top-0 right-0 m-2 text-xs text-gray-500">
          {dayjs(student.created_at).format("DD.MM.YYYY")}
        </div>
        {/* User title */}
        <div className="text-xl text-center">
          {student.first_name} {student.last_name}
        </div>
        <div className="flex gap-1">
          <p className="w-20 text-textSecondary">Email:</p>{" "}
          <p className={emailConflict ? "text-red-500" : ""}>{student.email}</p>
        </div>
        <div className="flex gap-1">
          <p className="w-20 text-textSecondary">Laji:</p>{" "}
          <p className={sportConflict ? "text-red-500" : ""}>{student.sport}</p>
        </div>

        <div className="flex gap-1">
          <p className="w-20 text-textSecondary">Ryhmä:</p>{" "}
          <p className={groupConflict ? "text-red-500" : ""}>{student.group}</p>
        </div>
        <div className="flex gap-1">
          <p className="w-20 text-textSecondary">Toimipiste:</p>{" "}
          <p>{student.campus}</p>
        </div>

        {/* buttons */}
        <div className="flex justify-center gap-4">
          {" "}
          <button
            className={`p-1 rounded-md hover:scale-110 ${
              sportConflict || groupConflict || emailConflict
                ? "text-gray-400 cursor-not-allowed"
                : "text-iconGreen"
            }`}
            onClick={() => {
              if (!(sportConflict || groupConflict || emailConflict)) {
                verifyStudentMutation.mutate();
              }
            }}
            disabled={sportConflict || groupConflict || emailConflict}
            title={verifyButtonTooltip}
          >
            <FiCheck size={20} />
          </button>
          <button
            className="p-1 rounded-md text-iconRed hover:scale-110"
            onClick={() => deleteStudentMutation.mutate()}
            title="Poista"
          >
            <FiTrash2 size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      {/* Student container */}
      <div className="flex flex-col border rounded-md md:col-span-2 bg-bgSecondary border-borderPrimary min-w-96">
        <div className="w-full py-2 text-xl text-center border-b rounded-t-md border-borderPrimary">
          <h2>Oppilaat</h2>
        </div>
        <div className="w-full py-2">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <LoadingScreen />
            </div>
          ) : error ? (
            <div className="w-full text-center text-red-500">
              Error: {error.message}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4 p-2 overflow-auto lg:justify-start">
              {unverifiedStudents.length === 0 ? (
                <div className="w-full text-center text-textSecondary">
                  Ei hyväksyttäviä oppilaita
                </div>
              ) : (
                unverifiedStudents.map((student) => (
                  <CreateStudentContainer
                    key={student.user_id}
                    student={student}
                    unverifiedSports={unverifiedSports}
                    unverifiedStudentGroups={unverifiedStudentGroups}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sport container */}
      <div className="flex flex-col border rounded-md bg-bgSecondary border-borderPrimary min-w-96">
        <div className="w-full py-2 text-xl text-center border-b rounded-t-md border-borderPrimary">
          <h2>Lajit</h2>
        </div>
        <div className="w-full py-2 ">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <LoadingScreen />
            </div>
          ) : error ? (
            <div className="w-full text-center text-red-500">
              Error: {error.message}
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-2 bg-bgSecondary">
              {unverifiedSports.length === 0 ? (
                <div className="text-center text-textSecondary">
                  Ei hyväksymistä odottavia lajeja
                </div>
              ) : (
                unverifiedSports.map((sport) => (
                  <CreateSportContainer key={sport.id} sport={sport} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* StudentGroup container */}

      <div className="flex flex-col border rounded-md bg-bgSecondary border-borderPrimary min-w-96">
        <div className="w-full py-2 text-xl text-center border-b rounded-t-md border-borderPrimary">
          <h2>Ryhmät</h2>
        </div>
        <div className="w-full py-2 ">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <LoadingScreen />
            </div>
          ) : error ? (
            <div className="w-full text-center text-red-500">
              Error: {error.message}
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-2 bg-bgSecondary">
              {unverifiedStudentGroups.length === 0 ? (
                <div className="text-center text-textSecondary">
                  Ei hyväksymistä odottavia ryhmiä
                </div>
              ) : (
                unverifiedStudentGroups.map((student_group) => (
                  <CreateStudentGroupContainer
                    key={student_group.id}
                    student_group={student_group}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function CreateEmailNotVerifiedStudentContainer({ student }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const deleteStudentMutation = useMutation({
    mutationFn: () => studentService.deleteStudent(student.user_id),
    onSuccess: () => {
      addToast("Oppilas poistettu", { style: "success" });
      queryClient.invalidateQueries({
        queryKey: ["unverifiedStudentsSportsCampuses"],
      });
    },
    onError: (error) => {
      addToast("Virhe poistettaessa oppilasta", { style: "error" });
      console.error("Error deleting student:", error);
    },
  });

  return (
    <div
      key={student.id}
      className="flex flex-col gap-2 p-4 border rounded-md hover:bg-hoverDefault border-borderPrimary"
    >
      {/* User title */}
      <div className="text-xl text-center">
        {student.first_name} {student.last_name}
      </div>
      <div className="flex gap-1">
        <p className="w-20 text-textSecondary">Email:</p> <p>{student.email}</p>
      </div>
      <div className="flex gap-1">
        <p className="w-20 text-textSecondary">Laji:</p>{" "}
        <p className={sportConflict ? "text-red-500" : ""}>{student.sport}</p>
      </div>

      <div className="flex gap-1">
        <p className="w-20 text-textSecondary">Ryhmä:</p>{" "}
        <p className={groupConflict ? "text-red-500" : ""}>{student.group}</p>
      </div>
      <div className="flex gap-1">
        <p className="w-20 text-textSecondary">Toimipiste:</p>{" "}
        <p>{student.campus}</p>
      </div>

      {/* buttons */}
      <div className="flex justify-center gap-4">
        <button
          className="p-1 rounded-md text-iconRed hover:scale-110"
          onClick={() => deleteStudentMutation.mutate()}
        >
          <FiTrash2 size={20} />
        </button>
      </div>
    </div>
  );
}

const CreateStudentGroupContainer = ({ student_group }) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const verifyStudentGroupMutation = useMutation({
    mutationFn: () => groupService.verifyStudentGroup(student_group.id),
    onSuccess: () => {
      addToast("Ryhmä hyväksytty", { style: "success" });
      queryClient.invalidateQueries({
        queryKey: ["unverifiedStudentsSportsCampuses"],
      });
    },
    onError: () => {
      addToast("Virhe hyväksyttäessä ryhmää", { style: "error" });
    },
  });

  const deleteStudentGroupMutation = useMutation({
    mutationFn: () => groupService.deleteGroup(student_group.id),
    onSuccess: () => {
      addToast("Ryhmä poistettu", { style: "success" });
      queryClient.invalidateQueries({
        queryKey: ["unverifiedStudentsSportsCampuses"],
      });
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        addToast("Poisto epäonnistui, koska ryhmässä on opiskelijoita.", {
          style: "error",
        });
      } else {
        addToast("Virhe poistettaessa ryhmää", { style: "error" });
      }
    },
  });

  return (
    <div
      key={student_group.id}
      className="flex justify-between gap-2 p-4 border rounded-md hover:bg-hoverDefault border-borderPrimary"
    >
      {/* StudentGroup title */}
      <div className="flex items-end gap-2 text-center">
        <div>
          <p className="m-0 text-xl">{student_group.name}</p>
        </div>
        <div>
          <p className="text-textSecondary text-sm  m-0.5"></p>
        </div>
      </div>

      {/* buttons */}
      <div className="flex justify-center gap-4">
        {" "}
        <button
          className="p-1 border rounded-md text-iconGreen hover:bg-bgSecondary border-bgSecondary hover:border-borderPrimary hover:scale-110 "
          onClick={() => verifyStudentGroupMutation.mutate()}
        >
          <FiCheck size={20} />
        </button>
        <button
          className="p-1 rounded-md text-iconRed hover:scale-110"
          onClick={() => deleteStudentGroupMutation.mutate()}
        >
          <FiTrash2 size={20} />
        </button>
      </div>
    </div>
  );
};

const CreateSportContainer = ({ sport }) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const verifySportMutation = useMutation({
    mutationFn: () => sportService.verifySport(sport.id),
    onSuccess: () => {
      addToast("Laji hyväksytty", { style: "success" });
      queryClient.invalidateQueries({
        queryKey: ["unverifiedStudentsSportsCampuses"],
      });
    },
    onError: () => {
      addToast("Virhe hyväksyttäessä lajia", { style: "error" });
    },
  });

  const deleteSportMutation = useMutation({
    mutationFn: () => sportService.deleteSport(sport.id),
    onSuccess: () => {
      addToast("Laji poistettu", { style: "success" });
      queryClient.invalidateQueries({
        queryKey: ["unverifiedStudentsSportsCampuses"],
      });
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        addToast("Poisto epäonnistui, koska lajilla on opiskelijoita.", {
          style: "error",
        });
      } else {
        addToast("Virhe poistettaessa lajia", { style: "error" });
      }
    },
  });

  return (
    <div
      key={sport.id}
      className="flex justify-between gap-2 p-4 border rounded-md hover:bg-hoverDefault border-borderPrimary"
    >
      {/* Sport title */}
      <div className="flex items-end gap-2 text-center">
        <div>
          <p className="m-0 text-xl">{sport.name}</p>
        </div>
        <div>
          <p className="text-textSecondary text-sm  m-0.5"></p>
        </div>
      </div>

      {/* buttons */}
      <div className="flex justify-center gap-4">
        {" "}
        <button
          className="p-1 rounded-md text-iconGreen hover:scale-110 "
          onClick={() => verifySportMutation.mutate()}
        >
          <FiCheck size={20} />
        </button>
        <button
          className="p-1 rounded-md text-iconRed hover:scale-110"
          onClick={() => deleteSportMutation.mutate()}
        >
          <FiTrash2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default VerificationPage;
