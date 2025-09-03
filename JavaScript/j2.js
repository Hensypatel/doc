const fetchData = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const success = true; // change to false to see the reject case
      if (success) {
        resolve("Data fetched successfully!");
      } else {
        reject("Failed to fetch data.");
      }
    }, 2000); // simulating 2-second delay
  });
};

fetchData()
  .then((result) => {
    console.log("✅ Success:", result);
  })
  .catch((error) => {
    console.log("❌ Error:", error);
  });
