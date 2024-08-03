"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";
import Groq from "groq-sdk";

require("dotenv").config();

export default function Home() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "" });
  const [recipe, setRecipe] = useState("");

  const addItem = async (e) => {
    e.preventDefault();
    if (newItem.name !== "" && newItem.price !== "") {
      await addDoc(collection(db, "items"), {
        name: newItem.name.trim(),
        price: newItem.price,
      });
      setNewItem({ name: "", price: "" });
    }
  };

  useEffect(() => {
    const q = query(collection(db, "items"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];

      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id });
      });
      setItems(itemsArr);
    });

    return () => unsubscribe();
  }, []);

  const deleteItem = async (id) => {
    await deleteDoc(doc(db, "items", id));
  };

  const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

  const groq = new Groq({
    apiKey: GROQ_API_KEY,
  });

  const generateRecipe = async () => {
    const itemNames = items.map((item) => item.name).join(", ");
    const chatCompletion = await getGroqChatCompletion(itemNames);
    setRecipe(chatCompletion.choices[0]?.message?.content || "");
  };

  async function getGroqChatCompletion(itemNames) {
    return groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Create a recipe using the following items: ${itemNames},Remove all asterisk symbols, format text with correct bullet points `,
        },
      ],
      model: "llama3-8b-8192",
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between sm:p-24 p-4 bg-[#77E4C8]">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-5xl p-4 text-center font-bold text-[#000000]">
          Pantry Tracker
        </h1>

        <div className="bg-[#36C2CE] p-4 rounded-large">
          <form
            className="grid grid-cols-6 items-center text-black"
            onSubmit={addItem}>
            <input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="col-span-3 p-3 border mx-3"
              type="text"
              placeholder="Enter Item"
            />
            <input
              value={newItem.price}
              onChange={(e) =>
                setNewItem({ ...newItem, price: e.target.value })
              }
              className="col-span-2 p-3 border mx-3"
              type="number"
              placeholder="Enter Quantity"
            />
            <button
              className="text-white bg-[#478CCF] hover:bg-[#3df283] p-3 text-xl"
              type="submit">
              +
            </button>
          </form>

          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                className="my-4 w-full flex justify-between bg-[#478CCF]">
                <div className="p-4 w-full flex justify-between text-white">
                  <span className="capitalize">{item.name}</span>
                  <span>{item.price}</span>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="ml-9 p-5 border-l-2 border-[#4535C1] hover:bg-[#c1353c] w-17 text-white">
                  X
                </button>
              </li>
            ))}
          </ul>
          <div className="w-full text-center">
            <button
              onClick={generateRecipe}
              className="text-white bg-[#4535C1] hover:bg-[#478CCF] p-3 mt-4 text-xl">
              Recipe
            </button>

            {recipe && (
              <div className="bg-white p-4 mt-4 rounded-lg">
                <h2 className="text-2xl mb-2 text-black">Generated Recipe</h2>
                <p className="text-black whitespace-pre-wrap">{recipe}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
