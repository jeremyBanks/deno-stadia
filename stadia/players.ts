import SQL from "https://deno.land/x/lite@0.0.9/sql.ts";

export const schema = SQL`
  create table Player (
    [playerId] text primary key,
    [player] json text,
  );

  create table PlayerFriendship {
    [left] text not null references Player(playerId)
    [right] text not null references Player(playerId)
    check (left < right)
    unique (left, right)
    unique (right, left)
  };
`;
