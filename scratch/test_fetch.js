async function test() {
  try {
    await fetch("http://localhost:3066/api/listening-event", { method: "POST" });
  } catch (err) {
    console.log("Error message:", err.message);
    console.log("Error name:", err.name);
    console.log("Error cause:", err.cause);
    console.log("Error cause code:", err.cause?.code);
  }
}
test();
