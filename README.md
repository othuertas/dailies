# The Dailies - A Personal Game Hub
This is a simple, clean, and self-contained webpage designed to host a personal gallery of daily online games. It's built with HTML, Tailwind CSS, and vanilla JavaScript, requiring no setup or build process.
## Features
⦁	Custom Game List: Easily edit a single file (index.html) to add, remove, or modify your list of daily games.
⦁	Daily Countdown: A clean timer at the top counts down to midnight (local time), when most daily games reset.
⦁	Played/Unplayed Tracking: Mark games as "played" for the day with a simple click. This status is saved in your browser's local storage and resets automatically each day.
⦁	Favorites System: Mark your most-loved games as favorites for quick access via a special filter.
⦁	Tag-Based Filtering: Assign tags (like "word", "music", "puzzle") to each game and use the automatically generated filter buttons to sort your list.
⦁	Fully Responsive: The layout works beautifully on desktop, tablets, and mobile devices.
## How to Customize
All customization happens directly within the index.html file.
1.	Open index.html in a text editor.
2.	Find the <script> tag at the bottom of the file.
3.	The very first thing inside the script is a JavaScript array called const games = [...].
4.	To add a new game, add a new entry to the array like this:

{  
name: "New Game Name",  
url: "[https://example.com](https://example.com)",  
description: "A short description of the game.",  
tags: ["tag1", "tag2"]  
},
