const OPTIONS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const generateRoomCode = () => {
  let code = "";
  for (let i = 0; i < 4; i++) {
    let nr = Math.floor(Math.random() * OPTIONS.length);
    code += OPTIONS[nr];
  }

  return code;
};

// for (let i = 0; i < 10; i++) {
//   console.log(generateRoomCode());
// }
