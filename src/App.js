// Categories for Opinions
const CATEGORIES = [
  { name: "sports", color: "#3b82f6" },
  { name: "politics", color: "#16a34a" },
  { name: "education", color: "#ef4444" },
  { name: "food", color: "#eab308" },
  { name: "entertainment", color: "#db2777" },
  { name: "lifestyle", color: "#14b8a6" },
  { name: "history", color: "#f97316" },
  { name: "art and culture", color: "#8b5cf6" },
];

import { useEffect, useState } from "react";
import supabse from "./supabase"; // the database
import "./style.css";

function App() {
  let [showForm, setShowForm] = useState(false);
  let [opinions, setOpinions] = useState([]);
  let [isLoading, setIsLoading] = useState(false);
  let [currentCategory, setCurrentCategory] = useState("all");
  let [currentSort, setCurrentSort] = useState("");

  useEffect(
    function () {
      // Getting data from database
      async function getOpinions() {
        setIsLoading(true);
        let query = supabse.from("Opinions").select("*");

        // Filtering Opinions by category
        if (currentCategory !== "all")
          query = query.eq("category", currentCategory);

        // Sorting the Opinions
        if (currentSort === "likes") {
          query = query.order("likes", { ascending: false });
        } else if (currentSort === "dislikes") {
          query = query.order("dislikes", { ascending: false });
        } else if (currentSort === "date") {
          query = query.order("created_at", { ascending: false });
        }

        const { data: opinions, error } = await query.limit(1000); // limit for the loading data

        if (!error) setOpinions(opinions);
        else alert("There was a problem getting data");
        setIsLoading(false);
      }
      getOpinions();
    },
    [currentCategory, currentSort]
  );

  return (
    <>
      <Header showForm={showForm} setShowForm={setShowForm} />
      {showForm ? (
        <OpinionForm setShowForm={setShowForm} setOpinions={setOpinions} />
      ) : null}
      <main className="main">
        <CategoryFilter setCurrentCategory={setCurrentCategory} />
        {isLoading ? (
          <Loader />
        ) : (
          <Opinions
            opinions={opinions}
            setOpinions={setOpinions}
            setCurrentSort={setCurrentSort}
          />
        )}
      </main>
    </>
  );
}

function Header({ showForm, setShowForm }) {
  // Logo, Title and share button
  return (
    <header className="header">
      <div className="logo">
        <img src="logo.png" alt="Logo" />
        <h1>Unpopular opinions</h1>
      </div>
      <button
        onClick={() => {
          setShowForm((show) => !show);
        }}
        className="btn btn-large"
        id="share-btn"
      >
        {showForm ? "close" : "share an opinion"}
      </button>
    </header>
  );
}

function Loader() {
  return <p className="message">Loading...</p>; // While data has not arrived from database yet
}

function Sort({ setCurrentSort }) {
  return (
    <div className="sort">
      <p className="sort-text">sort by: </p>
      <div className="sort-btns">
        <button className="btn sort-btn" onClick={() => setCurrentSort("date")}>
          Date
        </button>
        <button
          className="btn sort-btn"
          onClick={() => setCurrentSort("likes")}
        >
          Likes
        </button>
        <button
          className="btn sort-btn"
          onClick={() => setCurrentSort("dislikes")}
        >
          Dislikes
        </button>
      </div>
    </div>
  );
}

function OpinionForm({ setShowForm, setOpinions }) {
  // This form will drop down when share button is clicked and will send the new Opinoin to database when submit button is clicked
  let [text, setText] = useState("");
  let [author, setAuthor] = useState("");
  let [category, setCategory] = useState("");
  let textLength = text.length;

  async function handleSubmit(e) {
    e.preventDefault();

    if (text && author && category && textLength <= 200) {
      // Checking to see if the input is valid
      let { data: newOpinion, error } = await supabse
        .from("Opinions")
        .insert([{ text, author, category }])
        .select();

      if (!error) setOpinions((opinions) => [newOpinion[0], ...opinions]);

      setText("");
      setAuthor("");
      setCategory("");

      setShowForm(false);
    }
  }

  return (
    <form className="opinion-form" id="opinion-form" onSubmit={handleSubmit}>
      <input
        value={text}
        type="text"
        placeholder="Share an opinion"
        onChange={(e) => setText(e.target.value)}
      />
      <span>
        {/* Changing the number of remaining characters when typing: */}
        {textLength <= 200 ? 200 - textLength : "invalid: Text is too long"}
      </span>
      <input
        value={author}
        type="text"
        placeholder="My name is..."
        onChange={(e) => setAuthor(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Choose Category</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.name} value={cat.name}>
            {cat.name.toUpperCase()}
          </option>
        ))}
      </select>
      <button className="btn btn-large">Post</button>
    </form>
  );
}

function CategoryFilter({ setCurrentCategory }) {
  return (
    <aside>
      <ul>
        <li class="category">
          <button
            onClick={() => setCurrentCategory("all")}
            class="btn btn-all-categories"
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <li key={cat.name} class="category">
              <button
                onClick={() => setCurrentCategory(cat.name)}
                class="btn btn-category"
                style={{ backgroundColor: cat.color }}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </li>
      </ul>
    </aside>
  );
}

function Opinions({ opinions, setOpinions, setCurrentSort }) {
  if (opinions.length === 0)
    return (
      <p className="message">
        No opinions for this category yet! Create the first one 😁
      </p>
    );
  return (
    <section>
      <Sort setCurrentSort={setCurrentSort} />
      <ul className="Opinion_List">
        {opinions.map(
          (
            opinion // rendering Opinions
          ) => (
            <Opinion
              key={opinion.id}
              opinion={opinion}
              setOpinions={setOpinions}
            />
          )
        )}
      </ul>
      <p>
        There are {opinions.length} opinions in the database. Feel free to add
        your own!
      </p>
    </section>
  );
}

function Opinion({ opinion, setOpinions }) {
  let [hasVoted, setHasVoted] = useState(false);
  let [currentVote, setCurrentVote] = useState("");
  let [isUpdating, setIsUpdating] = useState(false);

  async function handleVote(columnName) {
    setIsUpdating(true);
    if (currentVote !== columnName) {
      // Preventing multiple clicks on a vote
      let { data: updatedOpinion, error } = await supabse
        .from("Opinions")
        .update({ [columnName]: opinion[columnName] + 1 })
        .eq("id", opinion.id)
        .select();
      if (!hasVoted) {
        setHasVoted(true);
      } else {
        // Handles switching the vote
        if (columnName === "likes") {
          let { data: updatedOpinion, error } = await supabse
            .from("Opinions")
            .update({ ["dislikes"]: opinion["dislikes"] - 1 })
            .eq("id", opinion.id)
            .select();
        } else {
          let { data: updatedOpinion, error } = await supabse
            .from("Opinions")
            .update({ ["likes"]: opinion["likes"] - 1 })
            .eq("id", opinion.id)
            .select();
        }
      }
      setCurrentVote(columnName);
      setIsUpdating(false);
    }
    if (!error)
      setOpinions((opinions) =>
        opinions.map((f) => (f.id === opinion.id ? updatedOpinion[0] : f))
      );
  }

  return (
    <li className="opinion">
      <div className="op-text">
        <div className="text">{opinion.text}</div>
        <div className="author">{opinion.author}</div>
      </div>
      <span
        className="tag"
        style={{
          backgroundColor: CATEGORIES.find(
            (cat) => cat.name === opinion.category
          ).color,
        }}
      >
        {opinion.category}
      </span>
      <div className="vote-buttons">
        <button onClick={() => handleVote("likes")} disabled={isUpdating}>
          👍 {opinion.likes}
        </button>
        <button onClick={() => handleVote("dislikes")} disabled={isUpdating}>
          👎 {opinion.dislikes}
        </button>
      </div>
    </li>
  );
}

export default App;
