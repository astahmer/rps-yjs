import { useYArray, useYDoc } from "zustand-yjs";
import * as Y from "yjs";

const connectDoc = (doc: Y.Doc) => {
  console.log("connect to a provider with room", doc.guid);
  return () => console.log("disconnect", doc.guid);
};

export const RPS = () => {
  const yDoc = useYDoc("myDocGuid", connectDoc);
  const { data, push } = useYArray<string>(yDoc.getArray("usernames"));
  return (
    <div>
      <button onClick={() => push([`username #${data.length}`])}>
        New Username
      </button>
      <ul>
        {data.map((username, index) => (
          <li key={index}>{username}</li>
        ))}
      </ul>
    </div>
  );
};
