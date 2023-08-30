import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { API, Storage } from 'aws-amplify';
import {
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
  withAuthenticator,
} from '@aws-amplify/ui-react';
import { listNotes } from "./graphql/queries";
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from "./graphql/mutations";

const App = ({ signOut }) => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    try{
      console.log("0");

      const apiData = await API.graphql({ query: listNotes });
      console.log("1");

      const notesFromAPI = apiData.data.listNotes.items;
      await Promise.all(
        notesFromAPI.map(async (note) => {
          if (note.image) {
            const url = await Storage.get(note.name);
            note.image = url;
          }
          console.log("note: ",note);
          
          return note;
        })
      );
      console.log("2");
      
      setNotes(notesFromAPI);
    }catch(err){
      console.error(err);
    }

  }

async function createNote(event) {
  event.preventDefault();
  console.log("trigger create")
  console.log("event target: ", event.target);
  const form = new FormData(event.target);
  console.log("form: ", form)
  const image = form.get("image");
  console.log("image: ",image);
  const data = {
    name: form.get("name"),
    description: form.get("description"),
    image: image.name,
  };
  console.log("data: ",data);

  if (!!data.image) await Storage.put(data.name, image);
  await API.graphql({
    query: createNoteMutation,
    variables: { input: data },
  });
  console.log("fetch create")
  fetchNotes();
  event.target.reset();
}


async function deleteNote({ id, name }) {
  const newNotes = notes.filter((note) => note.id !== id);
  setNotes(newNotes);
  await Storage.remove(name);
  await API.graphql({
    query: deleteNoteMutation,
    variables: { input: { id } },
  });
}

  return (
    <View className="App">
      <Heading level={1}>My Notes App</Heading>
      <View as="form" margin="3rem 0" onSubmit={createNote}>
      <View
        name="image"
        as="input"
        type="file"
        style={{ alignSelf: "end" }}
      />
      
        <Flex direction="row" justifyContent="center">

          <TextField
            name="name"
            placeholder="Note Name"
            label="Note Name"
            labelHidden
            variation="quiet"
            required
          />
          <TextField
            name="description"
            placeholder="Note Description"
            label="Note Description"
            labelHidden
            variation="quiet"
            required
          />
          <Button type="submit" variation="primary">
            Create Note
          </Button>
        </Flex>
      </View>
      <Heading level={2}>Current Notes</Heading>
      <View margin="3rem 0">
        {notes.map((note) => (
        <Flex
          key={note.id || note.name}
          direction="row"
          justifyContent="center"
          alignItems="center"
        >
          <Text as="strong" fontWeight={700}>
            {note.name}
          </Text>
          <Text as="span">{note.description}</Text>
          {note.image && (
            <div>
            <h1>123123</h1>
            <Image
              src={note.image}
              alt={`visual aid for ${notes.name}`}
              style={{ width: 400 }}
            />
            </div>

            
          )}
          <Button variation="link" onClick={() => deleteNote(note)}>
            Delete note
          </Button>
        </Flex>
        ))}
      </View>
      <Button onClick={signOut}>Sign Out</Button>
      


    </View>
  );
};

export default withAuthenticator(App);