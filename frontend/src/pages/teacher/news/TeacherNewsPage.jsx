import { useState, useEffect } from "react";
import newsService from "../../../services/newsService";
import { useQuery } from "@tanstack/react-query";
import cc from "../../../utils/cc";
import LoadingScreen from "../../../components/LoadingScreen";
import { format } from "date-fns";
import { FiEdit3 } from "react-icons/fi";
import { useBigModal } from "../../../hooks/useBigModal";
import { TbPinFilled } from "react-icons/tb";

const RenderSingleNews = ({ news }) => {
  const [opened, setOpened] = useState(false);
  const toggleOpen = () => setOpened(!opened);
  const { openBigModal } = useBigModal();
  return (
    <div
      className="relative p-4 border rounded-md cursor-pointer bg-bgSecondary md:max-w-96 border-borderPrimary hover:bg-bgPrimary"
      onClick={toggleOpen}
    >
      {news.pinned ? (

          <TbPinFilled size={20} title="Kiinnitetty" className="absolute top-[-3px] right-[-3px] m-1 text-primaryColor" />

      ) : null}
      <div className="relative w-full px-1 border-b border-borderPrimary">
        <button
          onClick={(event) => {
            event.stopPropagation();
            openBigModal("editNewsEntry", { entryId: news.id });
          }}
          className="absolute text-iconGray top-1 right-1 hover:text-primaryColor"
        >
          <FiEdit3 size={20} />
        </button>
        <h3 className="text-lg font-medium text-center">{news.title}</h3>
        <div className="flex p-1 text-sm text-textSecondary text-start">
          <span>{format(new Date(news.created_at), "dd.MM.yyyy")}</span>
          <span className="ml-auto">{news.author}</span>
        </div>
      </div>
      <div className="flex flex-wrap pt-2 text-sm">
        {news.campuses && news.campuses.length > 0 && (
          <div className="px-2 mx-1 border-2 rounded-xl bg-btnGray text-textPrimary">
            {news.campuses.map((campus, index) => (
              <span key={index} className="tag">
                {campus}
              </span>
            ))}
          </div>
        )}
        {news.sports && news.sports.length > 0 && (
          <div className="px-2 mx-1 border-2 rounded-xl bg-btnGray text-textPrimary">
            {news.sports.map((sport, index) => (
              <span key={index} className="tag">
                {sport}
              </span>
            ))}
          </div>
        )}
        {news.student_groups && news.student_groups.length > 0 && (
          <div className="px-2 mx-1 border-2 rounded-xl bg-btnGray text-textPrimary">
            {news.student_groups.map((group, index) => (
              <span key={index} className="tag">
                {group}
              </span>
            ))}
          </div>
        )}
        <span className="ml-2">{news.category}</span>
      </div>
      <p className={cc(opened ? "" : "line-clamp-3", "pt-2", "mx-1")}>
        {news.content}
      </p>
    </div>
  );
};

const TeacherNewsPage = () => {
  const { openBigModal } = useBigModal();

  const {
    data: newsData,
    isLoading: newsIsLoading,
    error: newsError,
  } = useQuery({
    queryKey: ["news"],
    queryFn: () => newsService.getNews(),
  });

  const {
    data: optionsData,
    isLoading: optionsIsLoading,
    error: optionsError,
  } = useQuery({
    queryKey: ["options"],
    queryFn: () => miscService.getGroupsSportsCampusesOptions(),
  });

  if (newsIsLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <LoadingScreen />
      </div>
    );
  }

  if (newsError) return <p>Error: {newsError.message}</p>;

  const sortedNews = newsData
    ? [...newsData].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      })
    : [];

  return (
    <div className="flex justify-center w-full h-full">
      <div className="flex w-full md:w-fit  md:min-w-[760px] flex-col gap-4 bg-bgSecondary ">
        <header className="relative w-full py-4 text-2xl text-center text-white border-b border-borderPrimary md:text-textPrimary md:bg-bgSecondary bg-primaryColor ">
          Tiedotteet
        </header>
        <div className="flex flex-wrap items-end justify-around gap-4">
          <button
            onClick={() => openBigModal("newNewsEntry")}
            className="px-4 py-2 text-white border rounded-md border-borderPrimary bg-primaryColor hover:bg-hoverPrimary"
          >
            {`+ Uusi tiedote`}
          </button>
        </div>

        <div className="grid justify-center gap-8 m-4 md:grid-cols-2 auto-rows-max">
          {sortedNews.map((news) => (
            <RenderSingleNews key={news.id} news={news} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherNewsPage;
