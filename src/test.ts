import { exec } from "child_process";
exec("dir", (error, stdout, stderr) => {
  if(error){console.error(error.message);return;}
  if(stderr){console.error(stderr);return;}
  console.log(stdout);
  return
});