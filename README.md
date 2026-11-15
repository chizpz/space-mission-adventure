# Space Mission Adventure

A 3D educational space game for children aged 7 to 14, made for a NASA hackathon.
Build a spacecraft, pass the Mission Check, and fly to the Moon, Mars and Jupiter's moon Europa.

## How to play

Open `index.html` through a web server (for example GitHub Pages). The game needs an internet connection the first time, because it loads the three.js library (r128) from cdnjs and a font from Google Fonts.

To publish with GitHub Pages: repository Settings, Pages, Source "Deploy from a branch", branch `main`, folder `/ (root)`.

Controls: joystick and action button on phones and tablets; mouse or arrow keys, Space, and P or Esc for pause on a computer.

## Files

- `index.html`: the whole game (code, styles, drawings).
- `sounds/`: music and sound effects.
- `photos/`: optional. If a file `photos/<id>.jpg` exists, the mission photo card shows it. The ids are listed in the game data (`ALBUM`), for example `moon_ok_1.jpg`.

## Made with AI

This game was made with AI. The code, the drawings, the 3D models and four sounds (`launch`, `countdown`, `win`, `partial`) were created with Claude, an AI model by Anthropic. The idea, the requirements, the other sounds and the testing come from the team.

## What is real and what is game logic

Real: names and years of rockets, facts about the Moon, Mars, Jupiter and Europa, the CADRE and PROMISE robots, real flight times, the photo stories.
Game logic: mass units, thrust, power, fuel, prices, rewards, XP, ranks and all formulas. The trajectory map is a simplified model (round orbits in one plane); its dates are not real launch windows. Europa Clipper does not land on Europa; the landing in the game is fiction.

## Sources

### How NASA designs missions
- NASA, Designing and Developing NASA Science Missions: https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf
- NASA Goddard Mission Design Lab: https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/
- NASA, RadWorks Storm Shelter: https://ntrs.nasa.gov/api/citations/20170002287/downloads/20170002287.pdf

### Rockets
- Wikipedia, Thor-Delta: https://en.wikipedia.org/wiki/Thor-Delta
- Wikipedia, Titan IIIE: https://en.wikipedia.org/wiki/Titan_IIIE
- Space.com, Delta II: https://www.space.com/41961-delta-ii-rocket.html
- NASA JPL, Juno press kit: https://www.jpl.nasa.gov/news/press_kits/juno/facts
- NASA Science, Europa Clipper: https://science.nasa.gov/mission/europa-clipper/
- NASASpaceflight, Europa Clipper launch: https://www.nasaspaceflight.com/2024/10/europa-clipper-launch/
- Spaceflight Now, first SLS launch: https://spaceflightnow.com/2022/11/16/nasa-triumphs-in-successful-debut-launch-of-huge-sls-moon-rocket/

### The Moon, Mars, Jupiter and Europa
- NASA Science, Surveyor 1: https://science.nasa.gov/mission/surveyor-1
- NASA NSSDC, Mars fact sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
- NASA, Europa FAQ: https://europa.nasa.gov/europa/faq/
- The Planetary Society, Europa: https://www.planetary.org/worlds/europa
- NASA JPL, Galileo findings on Europa's ocean: https://www.jpl.nasa.gov/news/galileo-findings-boost-idea-of-other-worldly-ocean/
- NASA Science, Galileo: https://science.nasa.gov/mission/galileo/

### Real flight times
- Moon, Surveyor 1 (May 30 to June 2, 1966): https://science.nasa.gov/mission/surveyor-1
- Mars, Perseverance (203 days): https://www.jpl.nasa.gov/news/touchdown-nasas-mars-perseverance-rover-safely-lands-on-red-planet/
- Jupiter, Juno (August 5, 2011 to July 4, 2016): https://www.jpl.nasa.gov/news/press_kits/juno/facts
- Europa, Europa Clipper (October 14, 2024 to April 11, 2030, planned): https://science.nasa.gov/photojournal/europa-clippers-trajectory-to-jupiter-2/

### Robots: CADRE and PROMISE
- NASA JPL, CADRE: https://www.jpl.nasa.gov/missions/cadre/
- NASA, Mini Rover Team Is Packed for Lunar Journey: https://www.nasa.gov/missions/tech-demonstration/cadre/nasas-mini-rover-team-is-packed-for-lunar-journey/
- Wikipedia, IM-3: https://en.wikipedia.org/wiki/IM-3
- NASA, PROMISE: https://www.nasa.gov/mission/promise/
- The Planetary Society, The Cost of a PROMISE: https://www.planetary.org/articles/the-cost-of-a-promise-lunar-rover

### Photo stories after each mission
Every card in the game shows its photo credit and source link. The full list is in the game: Settings, About the science.

### Sounds
- `launch`, `countdown`, `win`, `partial`: generated for this game from noise and sine waves.
- All other sounds were provided by the team.
