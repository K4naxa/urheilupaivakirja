import { useState, useEffect } from "react";
import newsService from "../../services/newsService";
import { useQuery } from "@tanstack/react-query";
import cc from "../../utils/cc";
import LoadingScreen from "../../components/LoadingScreen";
import { format } from "date-fns";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import { TbPinFilled } from "react-icons/tb";


const RenderSingleNews = ({ news }) => {
  const [opened, setOpened] = useState(false);
  const toggleOpen = () => setOpened(!opened);
  return (
    <div
      className="p-4 border rounded-md cursor-pointer bg-bgSecondary md:max-w-96 border-borderPrimary hover:bg-bgPrimary"
      onClick={toggleOpen}
    >
      {news.pinned ? (
        <TbPinFilled
          size={20}
          title="Kiinnitetty"
          className="absolute top-[-3px] right-[-3px] m-1 text-primaryColor"
        />
      ) : null}

      <div className="relative w-full px-1 border-b border-borderPrimary">
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

const StudentNewsPage = () => {
  const {
    data: newsData,
    isPending,
    error,
  } = useQuery({
    queryKey: ["news"],
    queryFn: () => newsService.getNews(),
  });

  if (isPending) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <LoadingScreen />
      </div>
    );
  }

  if (error) return <p>Error: {error.message}</p>;

  const sortedNews = newsData
    ? [...newsData].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      })
    : [];

  return (
    <div className="flex justify-center w-full h-full">
      <div className="flex w-full md:w-fit  md:min-w-[760px] flex-col gap-4 bg-bgSecondary">
        <header className="relative w-full py-4 text-xl text-center text-white border-b border-borderPrimary md:bg-bgSecondary bg-primaryColor md:text-textPrimary ">
          <Link
            to={"/"}
            className="absolute text-2xl transition-transform duration-150 translate-y-1/2 bottom-1/2 left-5 hover:scale-125"
          >
            <FiArrowLeft />
          </Link>
          Tiedotteet
        </header>

        <div className="grid justify-center gap-8 m-4 md:grid-cols-2 auto-rows-max">
          {sortedNews.length > 0 ? (
            newsData.map((news) => (
              <RenderSingleNews key={news.id} news={news} />
            ))
          ) : (
            <p>Ei tiedotteita</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentNewsPage;
