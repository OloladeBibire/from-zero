/* ============================================================
   FROM ZERO — GAME DATA
   Add a new career by appending an object to CAREERS.
   Choice object shape:
     { label, note, req, fx, out, flag, item }
     req : { skill:["Name",level], item:"Shop item name", flag:"flag",
             cash:1500, rep:50 }        (all conditions must hold)
     fx  : { cash, rep, sat, stress, skills:{Name:delta} }
     out : outcome text shown after choosing
     flag: sets a flag (future opportunities, revenue/expense effects)
     item: adds a shop/equipment item by name
   ============================================================ */

const CAREERS = [
  /* ================= BARBER ================= */
  {
    id: "barber",
    name: "Barber",
    icon: "💈",
    tagline: "Clippers, chrome and nerve",
    blurb: "You start with second-hand clippers and a squeaky chair in a busy barbershop. Fade game or fold.",
    challenge: "Thin margins, brutal word of mouth, and a slick competitor across the street.",
    startMoney: 350,
    skills: { "Cutting": 2, "Fading": 1, "Rapport": 1 },
    startKit: ["Basic clippers", "Second-hand chair"],
    rent: 120,
    base: 420,
    shop: [
      { name: "Pro-grade clippers", price: 240, upk: 15, inc: 0.08, desc: "Faster, cleaner fades. Unlocks premium work." },
      { name: "Barber's styling station", price: 300, upk: 20, inc: 0.07, desc: "Mirror, shelf, hot towels. Clients notice." },
      { name: "Coffee & waiting bench", price: 120, upk: 10, inc: 0.05, desc: "A queue that enjoys waiting comes back." }
    ],
    episodes: [
      {
        title: "Open for Business",
        text: "You've rented a chair in the busiest barbershop on the block. Your clippers are second-hand, the chair squeaks, and your first walk-in is watching you in the mirror like you might ruin his head. This is week one of your name being on the work.",
        choices: [
          { label: "Run a grand-opening discount", note: "Cheap cuts, full chairs", fx: { cash: 60, rep: 3, sat: 5, stress: 6 }, out: "Word travels fast when it's cheap. Four walk-ins become four regulars — and two of them tip." },
          { label: "Charge full price, let the work speak", note: "Slower, prouder", fx: { rep: 2, sat: 4, skills: { "Cutting": 1 } }, out: "Only three clients today, but each one leaves inspecting the mirror with a slow nod. Steady hands beat loud offers." },
          { label: "Rush clients through to squeeze in more cuts", fx: { cash: 80, sat: -10, stress: 15 }, flag: "rushed", out: "Eight heads in five hours. Your shoulders ache, one fade is visibly crooked, and the queue noticed the queue." }
        ]
      },
      {
        title: "The Vanishing Fade",
        text: "A regular stands up, turns to the mirror, and announces that his fade is 'crooked' — loudly, while three people wait. He wants a refund. He is filming this.",
        choices: [
          { label: "Refund him and redo the cut free", fx: { cash: -30, rep: 5, sat: 8, stress: 8 }, flag: "service-star", out: "He posts the redo, not the meltdown. Two people in the queue book you because of how you handled it." },
          { label: "Stay calm, offer a free tidy-up next visit", fx: { rep: 2, sat: 4, stress: 5 }, flag: "loyal-client", out: "He accepts, half-sulkily. He's back in three weeks — and brings his brother." },
          { label: "Refuse. The cut is fine and he knows it", fx: { rep: -8, sat: -12, stress: 10 }, out: "He leaves without paying. The video is up by dinner. The chair feels colder all week." }
        ]
      },
      {
        title: "The Shop Across the Street",
        text: "A sleek new barbershop opens directly opposite — neon sign, online booking, barbers with ring lights. Your chair sits empty for two straight days.",
        choices: [
          { label: "Undercut their prices and fight for it", fx: { cash: -20, rep: 1, stress: 12 }, flag: "price-war", out: "You win the price war and lose the margin. The chair is busy, but every cut feels like charity." },
          { label: "Double down on your signature skin fades", fx: { rep: 4, skills: { "Fading": 1 } }, flag: "signature", out: "You spend the slow days drilling fades on anyone with hair. By Friday, someone asks for 'the barber with the fades' by name." },
          { label: "Buy the rival's owner-barber a coffee and ask for advice", fx: { rep: 1, stress: -5, skills: { "Rapport": 1 } }, flag: "mentor", out: "He's older than he looks and generous with it: 'Price is a promise. Keep yours and keep your clients.' You leave with a plan." }
        ]
      },
      {
        title: "The Wedding Party",
        text: "A groomsmen squad needs eight sharp cuts before Saturday's wedding. Big money, big pressure, and every photo lives forever.",
        choices: [
          { label: "Take the job and grind through it", fx: { cash: 150, rep: 3, sat: 4, stress: 22 }, out: "Seven great cuts and one you'd rather not discuss. The groom tips you anyway. Your back files a complaint." },
          { label: "Take it — but borrow your pro clippers first", req: { item: "Pro-grade clippers" }, fx: { cash: 230, rep: 6, sat: 8, stress: 15 }, flag: "wedding-rep", out: "Eight clean fades in record time. The photographer tags your work. Two groomsmen book standing appointments." },
          { label: "Decline — too big for you this month", fx: { stress: -6, rep: -2 }, out: "You say no politely. The quiet stings more than the lost money." }
        ]
      },
      {
        title: "Your Own Chair",
        text: "The shop owner offers you a choice: rent your own booth as an independent, or stay on commission. Meanwhile, a wide-eyed junior barber has been watching your work all month.",
        choices: [
          { label: "Rent your own booth ($400 deposit)", req: { cash: 400 }, fx: { cash: -400, rep: 3 }, flag: "booth", out: "The deposit hurts. The freedom doesn't. Your name goes on the mirror, and your clients follow you there." },
          { label: "Stay on commission — low risk, steady work", fx: { cash: 60, stress: -8 }, flag: "commission", out: "You hand over a slice of every cut, but sleep easy. For now, the safety is worth it." },
          { label: "Take on the junior as your apprentice", req: { rep: 45 }, fx: { stress: 10, skills: { "Rapport": 1 } }, flag: "employer", out: "You teach him neck lines and patience. He sweeps, books, and idolises you — teaching sharpens your own game." }
        ]
      },
      {
        title: "The Sign Above the Door",
        text: "A vacant storefront two blocks away is for lease. Signing means a real barbershop — your name on the door, your money on the line. Everyone says you're ready. Everyone isn't paying the rent.",
        choices: [
          { label: "Sign the lease — open YOUR shop", req: { cash: 1200 }, fx: { cash: -1200 }, flag: "owner", out: "The keys feel heavier than they look. You spend the first night repainting, the second night grinning at your own sign." },
          { label: "Stay solo and build a name worth queues", fx: { rep: 3, stress: -5, skills: { "Cutting": 1, "Fading": 1 } }, flag: "independent", out: "You turn down the lease and turn up the craft. There are worse things than being the barber people wait for." },
          { label: "Open the shop and put your apprentice on the second chair", req: { flag: "employer" }, fx: { cash: -1100 }, flag: "empire", out: "Two chairs, two mirrors, one nervous first hire. You are no longer just a barber. You are the boss of one." }
        ]
      }
    ],
    events: [
      {
        title: "Clippers Die Mid-Fade",
        text: "Your clippers stutter, smoke faintly, and die halfway through a fade. The client's head is, technically, unfinished art.",
        choices: [
          { label: "Buy new clippers immediately", fx: { cash: -90, stress: 5 }, out: "New clippers, finished fade, small heart attack. Tools earn their keep." },
          { label: "Finish with scissors and own it", fx: { sat: -6, rep: 1, skills: { "Cutting": 1 } }, out: "Scissor work saves the day and adds a skill. The client asks if 'the vintage finish' costs extra." }
        ]
      },
      {
        title: "A Familiar Face in the Queue",
        text: "A local athlete everyone recognises sits down in your chair. Phones appear. Every snap of this cut is free advertising — or free embarrassment.",
        choices: [
          { label: "Stay locked in and deliver your best", fx: { rep: 6, stress: 12 }, flag: "celebrity", out: "You don't rush, and you don't shake. The cut goes viral locally. Your bookings triple for a week." },
          { label: "Charm the room while you cut", fx: { rep: 2, sat: 5, stress: 8, skills: { "Rapport": 1 } }, out: "You're funny under pressure. The clips are mostly of your banter — but the cut holds up too." }
        ]
      }
    ],
    epilogue: "Somewhere on this block, a chair now squeaks for someone else. Yours stopped squeaking the day you stopped apologising for your prices."
  },

  /* ================= FASHION DESIGNER ================= */
  {
    id: "designer",
    name: "Fashion Designer",
    icon: "🧵",
    tagline: "Thread, nerve, and taste",
    blurb: "A sewing machine, a fabric stash, and a signature style nobody knows about yet. Make them know.",
    challenge: "Copycats, demanding clients, and fabric money that burns faster than it arrives.",
    startMoney: 600,
    skills: { "Sewing": 2, "Pattern Making": 1, "Trend Sense": 2 },
    startKit: ["Sewing machine", "Fabric stash"],
    rent: 140,
    base: 520,
    shop: [
      { name: "Serger machine", price: 320, upk: 20, inc: 0.08, desc: "Factory-grade finishing. Your seams stop apologising." },
      { name: "Dress form (mannequin)", price: 180, upk: 5, inc: 0.06, desc: "Draping becomes design instead of guessing." },
      { name: "Fabric hoard upgrade", price: 260, upk: 25, inc: 0.07, desc: "Silks, jacquards, the good stuff. Clients can feel it." }
    ],
    episodes: [
      {
        title: "The Market Stall",
        text: "Saturday's fashion market is where the city discovers new designers. A stall costs money you can feel, and the crowd decides in seconds.",
        choices: [
          { label: "Pay extra for the premium corner spot", req: { cash: 80 }, fx: { cash: -80, rep: 4, sat: 3 }, out: "Two coats and a skirt sell in the first hour. Foot traffic is a drug, and you just had your first taste." },
          { label: "Take the free corner and watch what people pass by", fx: { rep: 1, skills: { "Trend Sense": 1 } }, out: "Nobody buys much, but you learn exactly which silhouettes stop feet. That knowledge is worth more than one Saturday." },
          { label: "Skip the market — shoot a lookbook online instead", fx: { cash: -40, rep: 2 }, flag: "online", out: "Golden hour, a borrowed camera, three looks. The post does numbers. The comments ask about sizes." }
        ]
      },
      {
        title: "The Impossible Bride",
        text: "A bride commissions a wedding dress with a three-week deadline, a shifting vision, and a mother who has opinions. The pay is very good. So is the risk.",
        choices: [
          { label: "Take it and pull all-nighters", fx: { cash: 260, stress: 28, skills: { "Sewing": 1 } }, out: "It's 3am and the bodice is perfect. So are the eye bags. The dress is a triumph; you are a zombie." },
          { label: "Take it with firm revision limits in writing", fx: { cash: 190, sat: 5 }, flag: "professional", out: "Two revisions, both reasonable, both documented. The client respects the boundary because you built it first." },
          { label: "Decline and refer her to a designer friend", fx: { rep: 1, stress: -5 }, flag: "network", out: "Your friend nails the dress and mentions you to everyone who compliments it. Referrals travel." }
        ]
      },
      {
        title: "The Copycat",
        text: "A fast-fashion account has ripped your signature draped jacket and sells it for a third of your price. Their version is everywhere. Their version is worse.",
        choices: [
          { label: "Call them out publicly", fx: { rep: 3, stress: 12 }, flag: "loud", out: "The thread gets shared by every maker in the city. Sympathy buys attention, but attention doesn't pay rent." },
          { label: "Answer with a better collection", req: { cash: 100 }, fx: { cash: -100, rep: 6, skills: { "Pattern Making": 1 } }, flag: "limited-run", out: "You drop a limited run of ten, numbered, with your signature inside the collar. The copy sells louder. Yours sells out." },
          { label: "Ignore it and keep serving your clients", fx: { stress: -6, sat: 4 }, out: "You refuse to share a stage with them. Your regulars know the difference, and they keep coming." }
        ]
      },
      {
        title: "The Influencer",
        text: "A local influencer with real reach offers to wear your piece 'for exposure.' She mentions, casually, that her last three brand deals paid her.",
        choices: [
          { label: "Take the free exposure", fx: { rep: 3, stress: 5 }, flag: "influencer", out: "She wears it once. The post does well. Two DMs, one sale, and a lesson about the word 'exposure.'" },
          { label: "Offer a paid collab with a discount code", req: { cash: 200 }, fx: { cash: -200, rep: 8 }, flag: "influencer", out: "The story reaches 40,000 people and your discount code actually gets used. Exposure, it turns out, is negotiable." },
          { label: "Politely decline and protect your margins", fx: { stress: -5, sat: 4 }, out: "You'd rather owe nothing to a phone. Your next client books because a friend called your work 'the real thing.'" }
        ]
      },
      {
        title: "The Studio",
        text: "A shared studio with other makers is offering desks: light, machines, and a community — for rent. Or you could stay home and upgrade your own corner.",
        choices: [
          { label: "Join the shared studio", req: { cash: 300 }, fx: { cash: -300, rep: 2 }, flag: "studio", out: "The studio hums with overmakers. A jeweller photographs your pieces; a ceramicist teaches you about glaze palettes. Ideas compound." },
          { label: "Stay home and buy a serger", fx: { cash: -320 }, item: "Serger machine", out: "The serger purrs like a promise. Your finishes jump a tier overnight, and home becomes headquarters." },
          { label: "Go made-to-order only, one piece at a time", fx: { sat: 6, rep: 2 }, flag: "drop-model", out: "No stock, no waste, no guessing. Every order is a yes before you cut fabric." }
        ]
      },
      {
        title: "Fashion Week Pop-Up",
        text: "The city's fashion week is hosting pop-up slots. A full booth costs $1,000 and puts your rack in front of press, buyers, and the people who decide who's 'next.'",
        choices: [
          { label: "Full collection, full booth", req: { cash: 1000 }, fx: { cash: -1000 }, flag: "runway", out: "Your ten looks hang under real lights. A boutique owner asks if you can produce twenty pieces by spring. You say yes and float home." },
          { label: "Split a booth with studio friends", req: { flag: "studio" }, fx: { cash: -400, rep: 4 }, flag: "runway-lite", out: "Four makers, one booth, shared nerves. A style editor photographs your piece next to a friend's — everybody rises." },
          { label: "Skip fashion week and go deep on made-to-measure", fx: { skills: { "Pattern Making": 1 }, rep: 2 }, flag: "bespoke", out: "While others chase flashes, you chase fit. Your clients start calling it 'their tailor' — the highest compliment in the trade." }
        ]
      }
    ],
    events: [
      {
        title: "Wrong Shipment",
        text: "Your fabric order arrives in the wrong colour. The commission is due Friday and the client asked for emerald, not petrol blue.",
        choices: [
          { label: "Reorder express and eat the cost", fx: { cash: -70, stress: 8 }, out: "The right green arrives Thursday, 11pm. You sew through the night. The client never knows how close it was." },
          { label: "Redesign around the colour and sell the pivot", fx: { rep: 2, skills: { "Trend Sense": 1 } }, out: "You re-swatch the design, call it a limited 'Petrol' edition, and the client loves it more. Instinct is a skill." }
        ]
      },
      {
        title: "The Vintage Find",
        text: "A back-alley vintage shop has a deadstock roll of your dream fabric at a suspiciously good price. The seller will not hold it.",
        choices: [
          { label: "Buy the roll", req: { cash: 60 }, fx: { cash: -60, rep: 1 }, flag: "deadstock", out: "Two metres of fabric nobody else will ever own. Your next piece literally cannot be copied." },
          { label: "Walk away — budget is budget", fx: { stress: -3 }, out: "You leave it. Discipline is also a material, and it's cheaper." }
        ]
      }
    ],
    epilogue: "Your studio still smells like steam and thread, which is what ambition smells like when it starts paying rent."
  },

  /* ================= PHONE REPAIR TECHNICIAN ================= */
  {
    id: "repair",
    name: "Phone Repair Technician",
    icon: "🔧",
    tagline: "Torx bits and steady hands",
    blurb: "A precision toolkit, an anti-static mat, and a shoebox of other people's tragedies. Fix what's broken, profit from it.",
    challenge: "Bad parts, razor-thin trust, and one fried motherboard from going under.",
    startMoney: 500,
    skills: { "Diagnostics": 2, "Microsoldering": 1, "Customer Care": 1 },
    startKit: ["Precision toolkit", "Anti-static mat"],
    rent: 100,
    base: 500,
    shop: [
      { name: "Microscope & hot-air station", price: 380, upk: 20, inc: 0.09, desc: "Board-level work under magnification. Unlocks serious jobs." },
      { name: "Parts inventory crate", price: 250, upk: 30, inc: 0.07, desc: "Screens, batteries, flex cables on hand. Same-day fixes." },
      { name: "Diagnostic bench software", price: 150, upk: 10, inc: 0.05, desc: "Cuts diagnosis time in half, quotes in minutes." }
    ],
    episodes: [
      {
        title: "The Shoebox of Doom",
        text: "A customer slides a shoebox across your mat: a water-logged phone, a bag of loose screws, and a note reading 'another shop tried.' It smells faintly of despair.",
        choices: [
          { label: "Full diagnostic before quoting anything", fx: { rep: 3, sat: 4, skills: { "Diagnostics": 1 } }, out: "Corrosion on the charging board, two stripped screws, hope intact. Your honest quote earns a nod and a paid deposit." },
          { label: "Quote a fix on the spot and dive in", fx: { cash: 60, stress: 14 }, out: "Three hours later it boots. You charged too little and sweated too much, but it works — and he told his office." },
          { label: "Decline the mess", fx: { rep: -3, stress: -5 }, out: "The shoebox leaves. So does a story about 'the tech who got scared of a shoebox.'" }
        ]
      },
      {
        title: "The Wrong Part",
        text: "Your supplier sent a counterfeit screen. It looked perfect. Two days later, a customer's phone dies mid-call — your repair, your name.",
        choices: [
          { label: "Replace it free and refund the labour", fx: { cash: -90, rep: 6, sat: 8 }, flag: "integrity", out: "You apologise once and fix it properly. He later brings you his laptop, his iPad, and his whole family's phones." },
          { label: "Blame the supplier, offer a discount next time", fx: { cash: -20, rep: 1, sat: -4 }, out: "It's technically true, which is not how trust works. He pays the discount less attention than you hoped." },
          { label: "Deny everything — it 'just happened'", fx: { rep: -9, sat: -12 }, flag: "shady", out: "He leaves. Then the one-star review leaves. It has pictures." }
        ]
      },
      {
        title: "The Board-Level Job",
        text: "A repair shop across town calls: a corroded charging IC they can't touch. It's microsoldering, magnification, and your steadiest hand.",
        choices: [
          { label: "Attempt it live on your mat", fx: { cash: 170, stress: 22, skills: { "Microsoldering": 1 } }, out: "The joint holds on the third try. Your hands stop shaking an hour after it boots. The shop sends its overflow to you from now on." },
          { label: "Practice on scrap boards first, then attempt", req: { cash: 100 }, fx: { cash: 60, skills: { "Microsoldering": 1 } }, flag: "b2b", out: "You burn three dead boards to save one live one. The call back says 'perfect,' and their overflow work starts arriving." },
          { label: "Refer it to a specialist and keep the relationship", fx: { rep: 2, stress: -5 }, flag: "network", out: "The specialist does it well and sends you two easy jobs as thanks. Sometimes the smartest repair is the one you don't make." }
        ]
      },
      {
        title: "The Flipping Temptation",
        text: "A friend flips refurbished phones — buys broken, sells working. He offers you in on a batch. Repairs are your craft; flipping is your money.",
        choices: [
          { label: "Invest $300 in the batch", req: { cash: 300 }, fx: { cash: -300 }, flag: "flipper", out: "Eight phones, four dead on arrival, six alive by the end of the week. The margins are ugly, legal, and real." },
          { label: "Stick to repairs — mastery over hustle", fx: { stress: -6, skills: { "Diagnostics": 1 } }, out: "You pass. That weekend you rebuild your diagnostic routine, and your quotes get faster and sharper." },
          { label: "Partner up: he flips, you fix the stock", fx: { cash: 100 }, flag: "partner", out: "He sources, you revive, both profit. The first split is small and the spreadsheet is shared." }
        ]
      },
      {
        title: "The Kiosk Decision",
        text: "The mall offers you a repair kiosk lease: huge foot traffic, scary rent. Or you could stay home and pour money into tools instead.",
        choices: [
          { label: "Take the kiosk lease", req: { cash: 600 }, fx: { cash: -600 }, flag: "storefront", out: "Day one: nine screen jobs and a crowd. The rent is a monster, but so is the queue." },
          { label: "Stay home, buy the microscope rig", fx: { cash: -380 }, item: "Microscope & hot-air station", out: "The rig arrives and your bench becomes a lab. Word spreads among the other shops: 'the tech who does boards.'" },
          { label: "Hire a part-time tech for walk-ins", req: { rep: 45 }, fx: { cash: -150, stress: 8 }, flag: "employer", out: "She handles the simple jobs while you take the boards. Teaching her your standards takes longer than fixing phones." }
        ]
      },
      {
        title: "The Franchise Call",
        text: "A national repair chain emails an offer: buy your workshop and hire you to run it, or license their brand. Your little mat suddenly has suitors.",
        choices: [
          { label: "Sell the workshop — cash out", req: { flag: "storefront" }, fx: { cash: 3500 }, flag: "sold", out: "The signature dries on the sale. You walk out with a cheque and, oddly, a desire to fix something just for fun." },
          { label: "Refuse — stay independent", fx: { rep: 4, stress: -5 }, flag: "independent", out: "You reply with something short and polite. The bench feels like yours again — because it is." },
          { label: "Take the franchise licence", fx: { cash: -700 }, flag: "franchise", out: "Their brand, your hands, their supplier prices. The parts bill drops and the orange polo is, regretfully, comfortable." }
        ]
      }
    ],
    events: [
      {
        title: "The E-Waste Goldmine",
        text: "A dumpster behind an office building is full of retired phones. Most are e-waste. Some are inventory.",
        choices: [
          { label: "Salvage parts for the evening", fx: { cash: 90, stress: 10 }, out: "Four working batteries, two clean screens, one mystery. Your parts bin gets free and heavier." },
          { label: "Leave it — you're not a scavenger", fx: { stress: -4 }, out: "You walk past. The dumpster keeps its secrets." }
        ]
      },
      {
        title: "The Returner",
        text: "A customer returns with a phone you fixed, claiming a 'new problem' that looks suspiciously like the old one.",
        choices: [
          { label: "Reopen it and check your own work first", fx: { rep: 3, sat: 5, stress: 6 }, out: "The connector had shifted — your mistake, quietly fixed. He never knows how close the review was to being fair." },
          { label: "Charge a reduced second-repair fee", fx: { cash: 25, sat: -5 }, out: "He pays the fee, unhappy about it. Fairness is exact, and exact is rarely loved." }
        ]
      }
    ],
    epilogue: "Every device you ever fixed is still out there, working — which is more than most careers can say about their output."
  },

  /* ================= PRIVATE TUTOR ================= */
  {
    id: "tutor",
    name: "Private Tutor",
    icon: "📚",
    tagline: "Patience is the product",
    blurb: "One whiteboard, one question bank, one ninth-grader failing algebra. From kitchen-table lessons to a learning centre.",
    challenge: "Helicopter parents, exam-season crunches, and income that lives and dies by word of mouth.",
    startMoney: 300,
    skills: { "Algebra": 2, "Essay Coaching": 1, "Patience": 2 },
    startKit: ["Whiteboard", "Question bank"],
    rent: 60,
    base: 430,
    shop: [
      { name: "USB headset & webcam", price: 90, upk: 5, inc: 0.06, desc: "Crisp audio makes online lessons feel premium." },
      { name: "Curriculum & worksheet library", price: 130, upk: 10, inc: 0.06, desc: "A full syllabus, ready for any student." },
      { name: "Second-hand whiteboard wall", price: 70, upk: 5, inc: 0.04, desc: "Room to teach, space to think." }
    ],
    episodes: [
      {
        title: "The Struggling Student",
        text: "Your first real client: a ninth-grader failing algebra, and parents who watch you like an investment. One hour will decide everything.",
        choices: [
          { label: "Free first session to prove the method", fx: { rep: 4, sat: 6 }, flag: "freebie", out: "You don't teach equations; you teach her she isn't 'bad at math.' Her mother signs up for eight sessions on the spot." },
          { label: "Standard rate with a progress guarantee", fx: { cash: 45, sat: 3 }, out: "You charge, and you deliver. The guarantee is honest — his quiz score climbs within two weeks." },
          { label: "Blitz through worksheets to show 'results'", fx: { cash: 45, sat: -8, stress: 8 }, out: "The worksheets pile up. The kid learns to hate the subject, and the parents start noticing the sighing." }
        ]
      },
      {
        title: "The Helicopter Parent",
        text: "A parent calls nightly. She wants you to do her son's homework 'so he keeps his A,' and wants a written guarantee of final grades.",
        choices: [
          { label: "Refuse to do the homework — explain why, kindly", fx: { rep: 2, sat: -5, stress: 8 }, flag: "integrity", out: "You say the hard sentence: 'If I do it, he learns that he can't.' She's furious. His teacher later thanks you personally." },
          { label: "Compromise: guided practice, he holds the pen", fx: { sat: 4, stress: 5 }, out: "You sit beside, not over. It's slower and it works. The mother relaxes when the quiz comes back." },
          { label: "Cave and 'help' generously", fx: { cash: 35, sat: 5, rep: -3, stress: 15 }, flag: "shortcuts", out: "The homework is immaculate. The test is not. Both of you know why, and neither says it." }
        ]
      },
      {
        title: "The Exam Crunch",
        text: "Three clients. One exam month. Everyone wants more hours, and there is only one of you.",
        choices: [
          { label: "Add weekend slots and grind", fx: { cash: 170, stress: 26 }, out: "Six-day weeks. The money is excellent and your patience is an overdrawn account." },
          { label: "Convert two students into a small group session", fx: { cash: 130, stress: 8, skills: { "Essay Coaching": 1 } }, flag: "group-model", out: "Two students, one table, half the hours. They compete and teach each other. You write 'scale' on a napkin." },
          { label: "Raise rush rates and let demand decide", fx: { cash: 210, sat: -6, rep: -1 }, out: "Two accept the new rate. One walks. The maths of demand is simple and a little bit rude." }
        ]
      },
      {
        title: "The Online Pivot",
        text: "A teacher friend says online tutoring is where the money went: wider reach, zero travel, evening slots. It needs a headset, a setup, and nerve.",
        choices: [
          { label: "Join an online tutoring platform", fx: { cash: -50 }, item: "USB headset & webcam", flag: "online", out: "Profile live, first booking in four days. The platform's cut stings; the reach is real." },
          { label: "Build your own setup and materials", req: { cash: 120 }, fx: { cash: -120, rep: 2 }, flag: "own-platform", out: "Your own scheduling page, your own worksheets, your own brand. Slower to start — nothing is leaking off the top." },
          { label: "Stay in-person only", fx: { stress: -6, sat: 4 }, out: "You keep the kitchen table. Travel time is invisible rent, and you're choosing to keep paying it." }
        ]
      },
      {
        title: "The Referral Flood",
        text: "Word has gotten around — five new referrals in one week. Taking them all means money and exhaustion; rationing them means craft and composure.",
        choices: [
          { label: "Take them all", fx: { cash: 230, stress: 30 }, flag: "overloaded", out: "Eight students. Your calendar looks like a ransom note. You are the most in-demand tired person in the district." },
          { label: "Refer the overflow to a tutor friend, take a finder's fee", fx: { cash: 90, rep: 1 }, flag: "network", out: "Your friend gets students, you get a fee, everyone keeps their goodwill. You invent a word for this: infrastructure." },
          { label: "Raise rates and stay selective", fx: { cash: 130, rep: 3, sat: 5 }, out: "You keep four students at a rate that respects the work. Quality becomes the marketing." }
        ]
      },
      {
        title: "The Learning Centre",
        text: "A small storefront near two schools is for lease. A real learning centre: rooms, tutors, a timetable, a sign. Or you can stay premium-solo and craft only.",
        choices: [
          { label: "Open the learning centre", req: { cash: 1200 }, fx: { cash: -1200 }, flag: "owner", out: "You sign the lease with shaking hands. Two chairs in the first room face the whiteboard you wrote your future on." },
          { label: "Stay a premium one-on-one tutor", fx: { skills: { "Algebra": 1, "Patience": 1 }, rep: 3 }, flag: "independent", out: "You decline the lease and raise your standards instead. A waiting list forms, and you finally feel allowed to call it a practice." },
          { label: "Record a structured video course", req: { cash: 300 }, fx: { cash: -300 }, flag: "course", out: "Six weeks of recording and editing your method. Sales trickle, then repeat. You teach while you sleep, which is a strange sentence." }
        ]
      }
    ],
    events: [
      {
        title: "The No-Show Week",
        text: "Two families cancel at short notice. Half your week evaporates; rent does not.",
        choices: [
          { label: "Introduce a 24-hour cancellation policy", fx: { rep: -1, sat: -3 }, flag: "policy", out: "Two clients grumble, then everyone respects it. Your calendar finally holds its shape." },
          { label: "Absorb it — goodwill now, stability later", fx: { cash: -50, sat: 4 }, out: "The families are grateful and book again. The empty Tuesday keeps its lesson." }
        ]
      },
      {
        title: "The Exam Triumph",
        text: "Your longest-struggling student passes her exam with her best grade of the year. Her mother posts about it everywhere.",
        choices: [
          { label: "Share the win (with permission) as your proof", fx: { rep: 6, sat: 6 }, flag: "testimonial", out: "The post does numbers. Three enquiries arrive before dinner, all asking for 'the tutor from the post.'" },
          { label: "Celebrate quietly and keep your head down", fx: { stress: -8, sat: 6 }, out: "You treat yourself to lunch and let the grade be the reward. Quiet pride compounds too." }
        ]
      }
    ],
    epilogue: "A generation of students now does algebra without flinching, and one of them still keeps your old whiteboard marker for luck."
  },

  /* ================= SOFTWARE DEVELOPER ================= */
  {
    id: "developer",
    name: "Software Developer",
    icon: "💻",
    tagline: "Ship it or stall it",
    blurb: "A refurbished laptop, second monitor, and a freelance inbox. Build, debug, ship — and try not to burn out at 2am.",
    challenge: "Scope creep, production fires, and the eternal choice between a pay cheque and your own product.",
    startMoney: 700,
    skills: { "JavaScript": 2, "Debugging": 2, "UI Design": 1 },
    startKit: ["Refurbished laptop", "Second monitor"],
    rent: 80,
    base: 600,
    shop: [
      { name: "Mechanical keyboard & chair", price: 220, upk: 10, inc: 0.05, desc: "Your back and your build times both improve." },
      { name: "Cloud hosting credits", price: 150, upk: 30, inc: 0.07, desc: "Deploy anything, anytime. Credibility per byte." },
      { name: "Design software licence", price: 180, upk: 15, inc: 0.06, desc: "Pixel-perfect mockups clients can't argue with." }
    ],
    episodes: [
      {
        title: "The First Gig",
        text: "A freelance posting: a broken checkout page, budget 'up to $150.' The bug is probably a thirty-line fix. The client is probably a nightmare.",
        choices: [
          { label: "Take it — reps over rates for gig one", fx: { cash: 150, stress: 10, skills: { "Debugging": 1 } }, out: "It takes three hours and one existential crisis. The checkout works, the review is five stars, and your inbox gains its first referral." },
          { label: "Negotiate: fixed scope, $280", req: { skill: ["Debugging", 3] }, fx: { cash: 280, rep: 2 }, flag: "negotiator", out: "You send a calm, itemised reply — the bug, the fix, the price. He accepts without blinking. Rate respect begins." },
          { label: "Decline the lowball and hold your line", fx: { stress: -5 }, flag: "picky", out: "You close the tab. The rent asks what you're waiting for. You are waiting, you reply, for a client worth having." }
        ]
      },
      {
        title: "Production Fire",
        text: "It's Black Friday. Your client's store crashes under load and the orders stop mid-surge. Your phone glows like an emergency light.",
        choices: [
          { label: "All-nighter, fix it NOW", fx: { cash: 220, rep: 5, stress: 30 }, flag: "firefighter", out: "At 4:40am, orders flow. The client sends a bonus and a thank-you GIF. You sleep until Sunday and dream of database indexes." },
          { label: "Roll back first, fix calmly, then root-cause", fx: { rep: 3, skills: { "Debugging": 1 } }, out: "You're live again in eleven minutes with a rollback, then find the real bug over coffee. Firefighting without the fire." },
          { label: "Point fingers at the hosting provider", fx: { rep: -6, sat: -10 }, out: "Half the fault is theirs; all of the blame lands on you. The client re-reads your contract and so do you." }
        ]
      },
      {
        title: "The CTO Offer",
        text: "A two-person startup wants a part-time technical co-founder: their product, your code, their equity and a little cash.",
        choices: [
          { label: "Take the cash-heavy contract", fx: { cash: 420, stress: 14 }, flag: "contractor", out: "Twelve hours a week, invoices paid on time, equity zero. It's a job with extra steps and no drama." },
          { label: "Take the equity-heavy deal", fx: { cash: 120 }, flag: "equity", out: "The paper is thrilling and the pay is thin. Your stake now depends on two strangers shipping on time." },
          { label: "Decline — build your own thing instead", fx: { stress: -5, skills: { "UI Design": 1 } }, flag: "own-product", out: "You open a blank repo and name it. The blank file stares back. It's the good kind of terror." }
        ]
      },
      {
        title: "The App Idea",
        text: "You sketch a habit-tracking app that people actually need. The choice is classic: ship it rough, polish it forever, or give it away for reputation.",
        choices: [
          { label: "Ship an ugly MVP this week", fx: { cash: -80, skills: { "JavaScript": 1 } }, flag: "shipped", out: "It's live. It's ugly. Three strangers use it and one emails a bug report with 'thank you' in it. Shipped beats perfect." },
          { label: "Polish the design before launch", fx: { cash: -30, skills: { "UI Design": 1 } }, out: "Two weeks in a design tool. The screens look like a product instead of a promise — and still aren't launched." },
          { label: "Open-source the core for reputation", fx: { rep: 7, stress: 6 }, flag: "oss", out: "You publish the repo and write an honest README. Stars arrive. A senior dev leaves a comment that begins 'interesting approach.'" }
        ]
      },
      {
        title: "The Agency Fork",
        text: "Two devs you trust want to form a mini agency. Or you could incorporate solo, or go full-time at the startup for a steady pay cheque.",
        choices: [
          { label: "Form the agency with your partners", fx: { cash: -200, rep: 2 }, flag: "employer", out: "Three contracts signed over one dinner. You divvy up roles and discover that managing developers is also debugging." },
          { label: "Incorporate solo and raise your rates", fx: { cash: -80, rep: 3 }, flag: "independent", out: "An invoice with 'Ltd' on it changes how you sit. New rate, new letterhead, same imposter syndrome with better formatting." },
          { label: "Go full-time at the startup for the pay cheque", fx: { cash: 600, stress: 12 }, flag: "employed", out: "Salary, benefits, a badge. The dream of your own product moves politely to the back burner." }
        ]
      },
      {
        title: "The Acquisition Letter",
        text: "An email with a logo and the word 'acquisition.' They like what you built. The number has six digits and a lot of zeros after the comma — or you can keep building.",
        choices: [
          { label: "Sell the app — take the deal", req: { flag: "shipped" }, fx: { cash: 4500 }, flag: "sold", out: "You read the terms twice, sign once, and close the laptop with the click of a man who no longer needs the money to feel real." },
          { label: "Refuse and grow the valuation", req: { flag: "shipped" }, fx: { stress: 10, rep: 3 }, flag: "unicorn-path", out: "You reply 'not yet, ask again in a year' — the bravest sentence in the industry. The roadmap gets bigger and so does the risk." },
          { label: "Decline; the agency is the dream", req: { flag: "employer" }, fx: { rep: 2, stress: -5 }, flag: "independent", out: "You write back kindly and close with 'we're not for sale.' Your partners buy the coffee for once." }
        ]
      }
    ],
    events: [
      {
        title: "Scope Creep",
        text: "'Small change,' says the client, describing a feature that would take a week and include payments.",
        choices: [
          { label: "Push back with a change request and a price", fx: { rep: 1, cash: 120, stress: 6 }, out: "You quote the feature properly. He sighs, then pays. Boundaries, it turns out, are billable." },
          { label: "Swallow it and stay 'the easy one'", fx: { stress: 18, sat: -5 }, out: "You build the feature unpaid and become the client's favourite doormat. Lesson invoiced in ulcers." }
        ]
      },
      {
        title: "Repo Goes Viral",
        text: "A popular dev account shares your open-source repo. Stars climb while you watch; your inbox fills with job offers and 'quick questions.'",
        choices: [
          { label: "Ride the wave — write docs and ship a release", fx: { rep: 5, stress: 8 }, out: "A weekend of documentation and a clean v1.1. The repo becomes your business card." },
          { label: "Let it cool down and keep client work first", fx: { stress: -5, cash: 60 }, out: "You answer client tickets while the stars slow to a stop. Rent thanks you; the roadmap sulks." }
        ]
      }
    ],
    epilogue: "Somewhere in production, your code is running right now — quietly, correctly, at scale. That's the closest thing a developer gets to immortality."
  }
];

/* ============ generic random events (any career) ============ */
const GENERIC_EVENTS = [
  {
    title: "The Tax Notice",
    text: "A cheerful grey envelope informs you that the tax office has noticed your success. Conveniently, it has also noticed your address.",
    choices: [
      { label: "Pay it now and stay clean", fx: { cash: -150, stress: 5 }, out: "Painful, prompt, filed. The envelope joins a folder that future-you will bless." },
      { label: "Defer it and hope next month is better", fx: { cash: -40, stress: 12 }, flag: "tax-deferred", out: "You defer. The number grows 5% while you sleep, like a spiteful plant." }
    ]
  },
  {
    title: "The Friend's Loan",
    text: "An old friend needs $100 by Friday. 'I'm good for it,' he says, with the exact tone of someone who has never once been good for it.",
    choices: [
      { label: "Lend it — friendship is the credit", fx: { cash: -100, stress: 6 }, flag: "generous", out: "The money leaves. The friend is visibly grateful, which is worth something, probably." },
      { label: "Say no, kindly", fx: { stress: 8 }, out: "You say no with genuine regret. The friendship survives; the awkwardness deposits interest." }
    ]
  },
  {
    title: "Dead Week",
    text: "Whatever can go quiet, goes quiet: enquiries stop, the phone doesn't ring, and the town apparently went on holiday without you.",
    choices: [
      { label: "Use the quiet to train and tidy up", fx: { stress: -8 }, flag: "trained", out: "You spend the dead week sharpening your craft and processes. Next week's revenue will notice (+8%)." },
      { label: "Panic-drop your prices to force demand", fx: { cash: -40, rep: 1, stress: 10 }, out: "A couple of bargain jobs trickle in. The discounts quietly reset what people expect to pay." }
    ]
  },
  {
    title: "The Great Review",
    text: "Someone wrote a long, glowing, five-star review about you. Named you. Tagged the exact neighbourhood. This is word of mouth with a megaphone.",
    choices: [
      { label: "Thank them and pin it where clients see it", fx: { rep: 5, sat: 4 }, out: "You reply warmly and screenshot it. New enquiries arrive already half-convinced." },
      { label: "Send them a small thank-you gift", fx: { cash: -30, rep: 3, sat: 6 }, out: "A small gift, big effect. They mention you three more times that month." }
    ]
  }
];

/* ============ achievements (earned ids persist across runs) ============ */
const ACHIEVEMENTS = [
  { id: "first-profit", ico: "💰", name: "First Profit", desc: "Finish a week in the green" },
  { id: "legend",       ico: "⭐", name: "Local Legend", desc: "Reach 90+ reputation" },
  { id: "debt-free",    ico: "🧾", name: "Debt Free", desc: "Clear a debt completely" },
  { id: "comeback",     ico: "🦅", name: "The Comeback", desc: "Go broke, then bank $1,000+" },
  { id: "master",       ico: "🏆", name: "Master of Craft", desc: "Max out any skill to 5" },
  { id: "full-kit",     ico: "🧰", name: "Fully Kitted", desc: "Own every equipment upgrade in a career" },
  { id: "boss",         ico: "👔", name: "The Boss", desc: "Hire help or own your premises" },
  { id: "zen",          ico: "🧘", name: "Zen Professional", desc: "Finish a run with stress 30 or below" },
  { id: "lucky",        ico: "🎲", name: "Feeling Lucky", desc: "Start a run through Lucky Dip" },
  { id: "all-five",     ico: "🎖️", name: "Jack of All Trades", desc: "Complete all five careers" }
];

/* ============ flags -> business effects (revenue multiplier adds & flat weekly costs) ============ */
const FLAG_EFFECTS = {
  "booth":        { rev: 0.15, exp: 60 },
  "commission":   { rev: 0.00, exp: 0 },
  "employer":     { rev: 0.20, exp: 90 },
  "owner":        { rev: 0.35, exp: 180 },
  "empire":       { rev: 0.45, exp: 240 },
  "storefront":   { rev: 0.25, exp: 120 },
  "studio":       { rev: 0.15, exp: 40 },
  "franchise":    { rev: 0.30, exp: 110 },
  "flipper":      { rev: 0.10, exp: 10 },
  "partner":      { rev: 0.10, exp: 0 },
  "influencer":   { rev: 0.10, exp: 0 },
  "group-model":  { rev: 0.10, exp: 0 },
  "online":       { rev: 0.08, exp: 0 },
  "own-platform": { rev: 0.12, exp: 10 },
  "course":       { rev: 0.15, exp: 5 },
  "b2b":          { rev: 0.15, exp: 0 },
  "runway":       { rev: 0.10, exp: 0 },
  "trained":      { rev: 0.08, exp: 0 },
  "runway-lite":  { rev: 0.06, exp: 0 },
  "shipped":      { rev: 0.10, exp: 10 },
  "oss":          { rev: 0.05, exp: 0 },
  "equity":       { rev: 0.05, exp: 0 },
  "contractor":   { rev: 0.00, exp: 0 },
  "employed":     { rev: 0.15, exp: 0 }
};