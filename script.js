const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const typing = document.getElementById("typing");
const clearBtn = document.getElementById("clearBtn");

let selectedCharacter = "elara";

let history = [];

document.querySelectorAll(".character").forEach(button => {

  button.addEventListener("click", () => {

    document
      .querySelectorAll(".character")
      .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

    selectedCharacter = button.dataset.character;

  });

});

function addMessage(text, type, name = "") {

  const message = document.createElement("div");

  message.className = `message ${type}`;

  if (type === "player") {

    message.innerHTML = `
      <div class="content">
        <p>${escapeHTML(text)}</p>
      </div>
    `;

  } else {

    message.innerHTML = `
      <div class="avatar">✨</div>

      <div>
        <div class="name">${escapeHTML(name)}</div>
        <p>${formatText(text)}</p>

        <button class="speakBtn">
          🔊 Speak
        </button>
      </div>
    `;

    const speakButton = message.querySelector(".speakBtn");

    speakButton.addEventListener("click", () => {
      speak(text);
    });

  }

  messages.appendChild(message);

  messages.scrollTop = messages.scrollHeight;
}

function formatText(text) {

  return escapeHTML(text)
    .replace(/\n/g, "<br>");
}

function escapeHTML(text) {

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}

async function sendMessage(message) {

  addMessage(message, "player");

  history.push({
    role: "player",
    content: message
  });

  input.value = "";

  typing.style.display = "block";

  try {

    const response = await fetch("/api/chat", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message,
        character: selectedCharacter,
        history
      })

    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    history.push({
      role: "npc",
      content: data.reply
    });

    addMessage(
      data.reply,
      "npc",
      data.character
    );

  } catch (error) {

    addMessage(
      "The magical connection failed. " + error.message,
      "npc",
      "System"
    );

  } finally {

    typing.style.display = "none";

  }
}

form.addEventListener("submit", event => {

  event.preventDefault();

  const message = input.value.trim();

  if (!message) return;

  sendMessage(message);

});

clearBtn.addEventListener("click", () => {

  history = [];

  messages.innerHTML = `
    <div class="message npc">

      <div class="avatar">👑</div>

      <div>

        <div class="name">
          Princess Elara
        </div>

        <p>
          You slowly open your eyes.
        </p>

        <p>
          The forest is silent around you.
          Something tells you that your old life is over...
          and a new one has begun.
        </p>

        <p>
          Elara steps closer.
        </p>

        <p>
          <em>
            "Tell me... who are you?"
          </em>
        </p>

      </div>

    </div>
  `;

});

function speak(text) {

  if (!("speechSynthesis" in window)) {
    alert("Voice isn't supported by this browser.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.rate = 0.95;
  utterance.pitch = 1.05;

  window.speechSynthesis.speak(utterance);
}
