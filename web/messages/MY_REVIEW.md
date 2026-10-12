# Burmese (မြန်မာ) review

All Burmese text in DEMS is a machine-assisted draft. **The countries branch is not merged until a native Burmese speaker has checked this list and signed it off at the end.**

What to check:
- **Meaning first.** Every step must say exactly what the English says, with no ambiguity a frightened reader could misread. Section 1 is life-critical: check it first and most carefully.
- Natural, plain Myanmar for the general public (not literal, not overly formal).
- Arabic digits (1, 2, 3) are used on purpose, to match phone numbers and the rest of the app.
- Words in `{curly braces}` are filled in by the app (a phone number such as 192, or an agency name). Keep them exactly as they are.
- Brand and source names stay in Latin script (DEMS, SMHI, USGS, GDACS, Open-Meteo, OpenStreetMap, MSB, MCF, PM2.5, TMD, DDPM).

Mark a change by editing the Myanmar column (or the source file: `web/messages/my.json` for UI text, `web/src/lib/prepare/guides.ts` for guide text, `web/src/lib/countries/*.ts` for agency names).

## Terms to look at especially

| English | Draft Myanmar | Question |
|---|---|---|
| Drop, Cover, Hold On | ဝပ်၊ ကွယ်၊ ကိုင် | Is this the phrase Myanmar schools and the DDM teach? |
| heatstroke | အပူလျှပ်ခြင်း | Or အပူရှပ်ခြင်း? Which does the public know? |
| hypothermia | ကိုယ်အပူချိန် အလွန်ကျခြင်း | Clear enough? |
| frostbite | အရေပြား အေးခဲပျက်စီးခြင်း | Clear enough? |
| upwind | လေညာဘက် (လေတိုက်လာသည့်ဘက်) | Must mean *towards where the wind comes from*. Is that how it reads? |
| flash flood | ရုတ်တရက်ရေကြီးခြင်း | Or တောင်ကျချောင်းရေ? |
| storm surge | မုန်တိုင်းဒီလှိုင်း | |
| shelter | ခိုလှုံရာနေရာ | |
| evacuate | ဘေးလွတ်ရာသို့ ရွှေ့ပြောင်း | |
| level names Safe / Watch / Warning / Unknown | ဘေးကင်း / စောင့်ကြည့် / သတိပေး / မသိရ | Short enough for badges; clear? |
| Myanmar agencies ({officials} in Myanmar) | ဘေးအန္တရာယ်စီမံခန့်ခွဲမှုဦးစီးဌာနနှင့် မိုးလေဝသနှင့် ဇလဗေဒညွှန်ကြားမှုဦးစီးဌာန | Department of Disaster Management and Department of Meteorology and Hydrology, matching the English. Are these the names people know (the older name was ကယ်ဆယ်ရေးနှင့် ပြန်လည်နေရာချထားရေးဦးစီးဌာန)? Three နှင့် in a row: readable? |
| Thai agencies ({officials} in Thailand) | ထိုင်းမိုးလေဝသဌာန (TMD) နှင့် ထိုင်း ဘေးအန္တရာယ်ကာကွယ်ရေးဌာန (DDPM) | |
| Swedish agencies ({officials} in Sweden) | SMHI နှင့် သင်နေထိုင်ရာ မြို့နယ်အုပ်ချုပ်ရေး | "municipality" (kommun) |
| Texts that name numbers and agencies | first_visit_body, now_guidance, about_limits_body, report_done_body(_one), emergency_call_first(_one) | These now take the chosen country's numbers ({sos}, {medical}, {police}, {num}) and agency names ({officials}). Check they read well with each country's values. |
| Earthquake summary | "…north and west, or from Myanmar" | Written for Thailand; reads oddly to a reader in Myanmar. Keep, or reword in all languages? |

## 1. Life-critical steps (check first)

These are the "During" steps. The first three of each are shown on the Now screen when a hazard reaches Warning.

| Guide | English | မြန်မာ |
|---|---|---|
| earthquake | Drop to the floor, cover your head, hold on to sturdy furniture. | ကြမ်းပြင်ပေါ် ဝပ်ချပါ၊ ခေါင်းကို လက်ဖြင့် ကွယ်ကာထားပါ၊ ခိုင်ခံ့သော ပရိဘောဂကို ကိုင်ထားပါ။ |
| earthquake | Stay away from windows and heavy objects that can fall. | ပြတင်းပေါက်များနှင့် ပြုတ်ကျနိုင်သော လေးလံသည့် ပစ္စည်းများမှ ဝေးဝေးနေပါ။ |
| earthquake | Do not use lifts; do not run outside while it is shaking. | ဓာတ်လှေကား မစီးပါနှင့်။ လှုပ်နေစဉ် အပြင်သို့ ပြေးမထွက်ပါနှင့်။ |
| earthquake | If outside, move away from buildings, trees and power lines. | အပြင်တွင် ရှိနေလျှင် အဆောက်အအုံများ၊ သစ်ပင်များနှင့် ဓာတ်ကြိုးများမှ ဝေးရာသို့ ရွှေ့ပါ။ |
| tsunami | Strong shaking or the sea pulling back: run to high ground now. | ပြင်းထန်စွာ လှုပ်ခတ်လျှင် သို့မဟုတ် ပင်လယ်ရေ ရုတ်တရက် နောက်သို့ ဆုတ်သွားလျှင် မြင့်သောနေရာသို့ ချက်ချင်း ပြေးပါ။ |
| tsunami | Go on foot; roads jam quickly. | ခြေလျင် သွားပါ။ လမ်းများ မြန်မြန် ပိတ်ဆို့တတ်သည်။ |
| tsunami | Go as high and as far inland as you can: at least 30 m up, 3 km inland, or the 3rd floor or higher of a strong concrete building. | တတ်နိုင်သမျှ မြင့်ရာနှင့် ကုန်းတွင်းဘက် ဝေးရာသို့ သွားပါ။ အနည်းဆုံး 30 မီတာ မြင့်သောနေရာ၊ ကမ်းခြေမှ ကုန်းတွင်းဘက် 3 ကီလိုမီတာ၊ သို့မဟုတ် ခိုင်ခံ့သော ကွန်ကရစ်အဆောက်အအုံ၏ 3 ထပ်နှင့်အထက်သို့ ရောက်အောင် သွားပါ။ |
| tsunami | Do not go back for belongings. | ပစ္စည်းများ ယူရန် ပြန်မသွားပါနှင့်။ |
| flood | Move to higher ground or the nearest shelter now. | မြင့်သောနေရာ သို့မဟုတ် အနီးဆုံး ခိုလှုံရာနေရာသို့ ယခုချက်ချင်း ရွှေ့ပါ။ |
| flood | Turn off electricity at the main switch, but only if you are dry and not standing in water. | သင့်ကိုယ်ခန္ဓာ ခြောက်သွေ့နေပြီး ရေထဲတွင် ရပ်နေခြင်း မရှိမှသာ မီးမိန်းခလုတ်ကို ပိတ်ပါ။ |
| flood | Never walk or drive through moving water; 15 cm can knock you down. | စီးဆင်းနေသော ရေထဲကို ဖြတ်၍ လမ်းမလျှောက်ပါနှင့်၊ ကားမမောင်းပါနှင့်။ ရေ 15 စင်တီမီတာ ရှိရုံဖြင့် လူကို လဲကျစေနိုင်သည်။ |
| flood | Take ID, medicine, phone, charger and drinking water. | မှတ်ပုံတင်ကတ်၊ ဆေးဝါး၊ ဖုန်း၊ အားသွင်းကြိုးနှင့် သောက်ရေကို ယူသွားပါ။ |
| flash-flood | Leave river banks, streams and low roads immediately. | မြစ်ကမ်း၊ ချောင်းများနှင့် နိမ့်သောလမ်းများမှ ချက်ချင်း ထွက်ခွာပါ။ |
| flash-flood | Climb to higher ground; do not wait for the water to rise. | မြင့်သောနေရာသို့ တက်ပါ။ ရေတက်လာသည်အထိ မစောင့်ပါနှင့်။ |
| flash-flood | Do not cross flooded roads or bridges, even in a car. | ရေလွှမ်းနေသော လမ်း သို့မဟုတ် တံတားကို ကားဖြင့်ပင်ဖြစ်စေ မဖြတ်ပါနှင့်။ |
| flash-flood | A roaring sound upstream means water is coming. | မြစ်ညာဘက်မှ ဟိန်းသံ ကြားရလျှင် ရေလာနေပြီ ဖြစ်သည်။ |
| storm | If told to evacuate, leave early while roads are open. | ဘေးလွတ်ရာသို့ ရွှေ့ပြောင်းရန် အကြောင်းကြားလျှင် လမ်းများ သွားလာ၍ရနေစဉ် စောစော ထွက်ခွာပါ။ |
| storm | Stay indoors, away from windows and glass doors. | အိမ်ထဲတွင်နေပြီး ပြတင်းပေါက်များနှင့် မှန်တံခါးများမှ ဝေးဝေးနေပါ။ |
| storm | Unplug electrical devices if lightning is close. | မိုးကြိုးပစ်မှု နီးကပ်လာလျှင် လျှပ်စစ်ပစ္စည်းများ၏ ပလပ်ကို ဖြုတ်ပါ။ |
| storm | Do not go out on boats or to the beach. | လှေဖြင့် မထွက်ပါနှင့်၊ ကမ်းခြေသို့ မသွားပါနှင့်။ |
| heat | Stay out of the sun between 11:00 and 15:00. | 11:00 မှ 15:00 အတွင်း နေပူထဲ မထွက်ပါနှင့်။ |
| heat | Drink water every 20 minutes, even if you are not thirsty. | ရေမငတ်သော်လည်း မိနစ် 20 တိုင်း ရေသောက်ပါ။ |
| heat | Confusion, fainting or very hot skin (with or without sweat) means heatstroke: call {medical} and cool the person with water and shade. | စိတ်ရှုပ်ထွေးခြင်း၊ သတိလစ်ခြင်း သို့မဟုတ် အရေပြား အလွန်ပူခြင်း (ချွေးထွက်သည်ဖြစ်စေ မထွက်သည်ဖြစ်စေ) သည် အပူလျှပ်ခြင်း ဖြစ်သည်။ {medical} ကို ဖုန်းခေါ်ပါ၊ လူနာကို အရိပ်ထဲ ခေါ်ပြီး ရေဖြင့် ကိုယ်ကို အေးအောင် လုပ်ပေးပါ။ |
| heat | Never leave children or pets in a parked car. | ရပ်ထားသော ကားထဲတွင် ကလေးများ သို့မဟုတ် အိမ်မွေးတိရစ္ဆာန်များကို ဘယ်တော့မှ ချန်မထားပါနှင့်။ |
| chemical | Go indoors, close windows, turn off fans and air conditioning. | အိမ်ထဲဝင်ပါ၊ ပြတင်းပေါက်များကို ပိတ်ပါ၊ ပန်ကာနှင့် လေအေးပေးစက်များကို ပိတ်ပါ။ |
| chemical | If told to evacuate, leave upwind and uphill. | ဘေးလွတ်ရာသို့ ရွှေ့ပြောင်းရန် အကြောင်းကြားလျှင် လေညာဘက် (လေတိုက်လာသည့်ဘက်) နှင့် မြင့်သောနေရာဘက်သို့ ထွက်ခွာပါ။ |
| chemical | If nothing better is at hand, cover your nose and mouth with a wet cloth. | ပိုကောင်းသော ပစ္စည်း မရှိလျှင် နှာခေါင်းနှင့် ပါးစပ်ကို ရေစိုအဝတ်ဖြင့် အုပ်ထားပါ။ |
| chemical | Do not touch spilled liquids or smoke residue. | ဖိတ်စင်နေသော အရည်များ သို့မဟုတ် မီးခိုးအကြွင်းအကျန်များကို မထိပါနှင့်။ |
| cold | Limit time outside; cover skin, because frostbite can start in minutes in strong wind. | အပြင်တွင် နေချိန်ကို လျှော့ပါ။ လေပြင်းထဲတွင် မိနစ်ပိုင်းအတွင်း အရေပြား အေးခဲပျက်စီးခြင်း စတင်နိုင်သဖြင့် အရေပြားကို ဖုံးအုပ်ထားပါ။ |
| cold | Watch for hypothermia (shivering, confusion, slurred speech): get the person warm and dry and call {medical}. | ကိုယ်အပူချိန် အလွန်ကျခြင်း (တုန်ခါခြင်း၊ စိတ်ရှုပ်ထွေးခြင်း၊ စကားဝဲခြင်း) လက္ခဏာများကို သတိထားပါ။ လူနာကို နွေးထွေးပြီး ခြောက်သွေ့အောင် လုပ်ပေးကာ {medical} ကို ဖုန်းခေါ်ပါ။ |
| cold | Never use a grill, camping stove or generator indoors (carbon monoxide). | အိမ်ထဲတွင် အသားကင်မီးဖို၊ စခန်းသုံးမီးဖို သို့မဟုတ် မီးစက်ကို ဘယ်တော့မှ မသုံးပါနှင့် (ကာဗွန်မိုနောက်ဆိုဒ် အဆိပ်သင့်နိုင်သည်)။ |
| cold | Keep moving if you must be outside. | အပြင်တွင် နေရမည်ဆိုလျှင် ကိုယ်ကို အမြဲ လှုပ်ရှားနေပါ။ |
| snow | Avoid unnecessary travel. | မလိုအပ်သော ခရီးသွားခြင်းကို ရှောင်ပါ။ |
| snow | If stuck in a car, stay in it, keep the exhaust pipe clear of snow and run the engine only briefly for heat. | ကားထဲတွင် ပိတ်မိနေလျှင် ကားထဲမှာပဲ နေပါ။ အိတ်ဇောပိုက်ကို နှင်းမပိတ်အောင် ရှင်းထားပြီး အနွေးဓာတ်ရရန် အင်ဂျင်ကို ခဏသာ နှိုးပါ။ |
| snow | Watch for snow sliding from roofs. | အမိုးများပေါ်မှ နှင်းလျှောကျလာနိုင်သည်ကို သတိထားပါ။ |
| smoke | Stay indoors with doors and windows closed. | တံခါးများနှင့် ပြတင်းပေါက်များကို ပိတ်ပြီး အိမ်ထဲတွင် နေပါ။ |
| smoke | Wear an N95 mask whenever you go outside. | အပြင်ထွက်တိုင်း N95 နှာခေါင်းစည်း တပ်ပါ။ |
| smoke | Avoid exercise outdoors, especially children and older people. | အပြင်တွင် လေ့ကျင့်ခန်း မလုပ်ပါနှင့်၊ အထူးသဖြင့် ကလေးများနှင့် သက်ကြီးရွယ်အိုများ။ |
| smoke | See a doctor if you have chest pain or trouble breathing. | ရင်ဘတ်အောင့်ခြင်း သို့မဟုတ် အသက်ရှူခက်ခြင်း ရှိလျှင် ဆရာဝန်ပြပါ။ |
| landslide | Muddy stream water or falling rocks: leave the slope now. | ချောင်းရေ ရွှံ့နောက်လာလျှင် သို့မဟုတ် ကျောက်တုံးများ ကျလာလျှင် တောင်စောင်းမှ ချက်ချင်း ထွက်ခွာပါ။ |
| landslide | Move sideways out of the path of a slide, not downhill. | မြေပြိုလာသည့် လမ်းကြောင်းမှ ဘေးတိုက် လွတ်ရာသို့ ရွှေ့ပါ၊ တောင်အောက်ဘက်သို့ မပြေးပါနှင့်။ |
| landslide | Stay away from river valleys and low areas. | မြစ်ချိုင့်ဝှမ်းများနှင့် နိမ့်သောနေရာများမှ ဝေးဝေးနေပါ။ |
| landslide | If you cannot escape, curl up and protect your head. | မလွတ်မြောက်နိုင်လျှင် ကိုယ်ကို ကွေးလိပ်ထားပြီး ခေါင်းကို ကာကွယ်ပါ။ |
| drought | Use water for drinking and cooking first. | ရေကို သောက်ရန်နှင့် ချက်ပြုတ်ရန် ဦးစားပေး သုံးပါ။ |
| drought | Reuse washing water for plants and toilets. | လျှော်ဖွပ်ဆေးကြောပြီးသော ရေကို အပင်ရေလောင်းရန်နှင့် အိမ်သာအတွက် ပြန်သုံးပါ။ |
| drought | Do not burn fields; dry land catches fire fast. | လယ်ကွင်းများကို မီးမရှို့ပါနှင့်။ ခြောက်သွေ့သော မြေတွင် မီးလျင်မြန်စွာ ကူးစက်လောင်ကျွမ်းတတ်သည်။ |
| drought | Get water from official distribution points if the supply stops. | ရေပြတ်သွားလျှင် တရားဝင် ရေဝေငှရာ နေရာများမှ ရေယူပါ။ |

## 2. Other guide text and the go-bag

| Guide | Part | English | မြန်မာ |
|---|---|---|---|
| flood | title | Flood | ရေကြီးခြင်း |
| flood | summary | Rivers and rain overflow into streets and homes. | မြစ်ရေနှင့် မိုးရေများ လမ်းများနှင့် နေအိမ်များထဲသို့ လျှံဝင်ခြင်း။ |
| flood | before | Know your nearest shelter and two ways to get there. | အနီးဆုံး ခိုလှုံရာနေရာနှင့် ထိုနေရာသို့ သွားနိုင်သော လမ်းကြောင်း 2 ခုကို သိထားပါ။ |
| flood | before | Move valuables, documents and medicine to a high shelf or upper floor. | အဖိုးတန်ပစ္စည်းများ၊ စာရွက်စာတမ်းများနှင့် ဆေးဝါးများကို မြင့်သောစင်ပေါ် သို့မဟုတ် အပေါ်ထပ်သို့ ရွှေ့ထားပါ။ |
| flood | before | Charge your phone and a power bank; keep a torch ready. | ဖုန်းနှင့် ပါဝါဘဏ်ကို အားသွင်းထားပြီး လက်နှိပ်ဓာတ်မီးကို အသင့်ထားပါ။ |
| flood | before | Pack a go-bag with water, food and ID for three days. | ရေ၊ အစားအစာနှင့် မှတ်ပုံတင်ကတ် ပါဝင်သော အရေးပေါ်အိတ်ကို 3 ရက်စာ ပြင်ဆင်ထားပါ။ |
| flood | after | Return home only when officials say it is safe. | တာဝန်ရှိသူများက ဘေးကင်းပြီဟု ပြောမှသာ အိမ်သို့ ပြန်ပါ။ |
| flood | after | Have an electrician check wiring before switching power on. | မီးပြန်မဖွင့်မီ လျှပ်စစ်ပညာရှင်ဖြင့် ဝါယာကြိုးများကို စစ်ဆေးခိုင်းပါ။ |
| flood | after | Throw away food and water that touched floodwater. | ရေကြီးရေနှင့် ထိတွေ့ခဲ့သော အစားအစာနှင့် ရေကို စွန့်ပစ်ပါ။ |
| flood | after | Watch for snakes and sharp debris when cleaning up. | သန့်ရှင်းရေးလုပ်စဉ် မြွေများနှင့် ချွန်ထက်သော အပျက်အစီးများကို သတိထားပါ။ |
| flash-flood | title | Flash flood and heavy rain | ရုတ်တရက်ရေကြီးခြင်းနှင့် မိုးသည်းထန်ခြင်း |
| flash-flood | summary | Water rises within minutes after heavy rain, often near hills. | မိုးသည်းထန်စွာ ရွာပြီးနောက် မိနစ်ပိုင်းအတွင်း ရေတက်လာခြင်း၊ တောင်ကုန်းများအနီးတွင် အဖြစ်များသည်။ |
| flash-flood | before | Check the rain forecast before hiking or camping near rivers. | မြစ်ချောင်းများအနီး တောင်တက်ခြင်း သို့မဟုတ် စခန်းချခြင်း မပြုမီ မိုးလေဝသ ခန့်မှန်းချက်ကို စစ်ဆေးပါ။ |
| flash-flood | before | Learn the high ground near your home, school and work. | အိမ်၊ ကျောင်းနှင့် အလုပ်နေရာ အနီးရှိ မြင့်သောနေရာများကို သိထားပါ။ |
| flash-flood | before | Clear drains and gutters around your house. | အိမ်ပတ်လည်ရှိ ရေမြောင်းများနှင့် အမိုးရေတံလျှောက်များကို ရှင်းလင်းထားပါ။ |
| flash-flood | before | Keep your phone charged and alerts switched on. | ဖုန်းကို အားပြည့်ထားပြီး သတိပေးချက်များကို ဖွင့်ထားပါ။ |
| flash-flood | after | Stay away from river banks; they can collapse. | မြစ်ကမ်းများ ပြိုကျနိုင်သဖြင့် ဝေးဝေးနေပါ။ |
| flash-flood | after | Report blocked roads and damaged bridges. | ပိတ်ဆို့နေသော လမ်းများနှင့် ပျက်စီးနေသော တံတားများကို သတင်းပို့ပါ။ |
| flash-flood | after | Check on neighbours, especially older people. | အိမ်နီးချင်းများ၊ အထူးသဖြင့် သက်ကြီးရွယ်အိုများ အဆင်ပြေမပြေ စစ်ဆေးကြည့်ရှုပါ။ |
| flash-flood | after | Boil water until the supply is confirmed safe. | ရေပေးဝေမှု ဘေးကင်းကြောင်း အတည်ပြုသည်အထိ ရေကို ကျိုချက်ပြီးမှ သောက်ပါ။ |
| storm | title | Storm | မုန်တိုင်း |
| storm | summary | Tropical storms bring strong wind, heavy rain and storm surge. | အပူပိုင်းမုန်တိုင်းများသည် လေပြင်း၊ မိုးသည်းထန်မှုနှင့် မုန်တိုင်းဒီလှိုင်းကို ယူဆောင်လာသည်။ |
| storm | before | Tie down or bring in loose objects outside. | အပြင်ရှိ လေတိုက်လျှင် လွင့်နိုင်သော ပစ္စည်းများကို ချည်နှောင်ထားပါ သို့မဟုတ် အိမ်ထဲ သိမ်းပါ။ |
| storm | before | Trim branches that hang over your roof or power lines. | အမိုး သို့မဟုတ် ဓာတ်ကြိုးများပေါ် တွဲလောင်းနေသော သစ်ကိုင်းများကို ခုတ်ပါ။ |
| storm | before | Stock water, food, a torch and batteries for three days. | ရေ၊ အစားအစာ၊ ဓာတ်မီးနှင့် ဓာတ်ခဲများကို 3 ရက်စာ စုဆောင်းထားပါ။ |
| storm | before | Know which room in your home is the strongest. | အိမ်တွင် အခိုင်ခံ့ဆုံး အခန်းကို သိထားပါ။ |
| storm | after | Stay away from fallen power lines and report them. | ပြတ်ကျနေသော ဓာတ်ကြိုးများမှ ဝေးဝေးနေပြီး သတင်းပို့ပါ။ |
| storm | after | Watch for flooding after the storm passes. | မုန်တိုင်းကျော်သွားပြီးနောက် ရေကြီးနိုင်သည်ကို သတိထားပါ။ |
| storm | after | Photograph damage for insurance before cleaning. | မသန့်ရှင်းမီ အာမခံတောင်းဆိုရန်အတွက် ပျက်စီးမှုများကို ဓာတ်ပုံရိုက်ထားပါ။ |
| storm | after | Use your phone only for urgent calls so lines stay free. | ဖုန်းလိုင်းများ မပိတ်ဆို့စေရန် အရေးပေါ်ကိစ္စအတွက်သာ ဖုန်းခေါ်ပါ။ |
| smoke | title | Smoke and haze (PM2.5) | မီးခိုးနှင့် မြူမှိုင်း (PM2.5) |
| smoke | summary | Fine dust from fires and traffic that harms lungs and heart. | မီးလောင်မှုနှင့် ယာဉ်အသွားအလာမှ ထွက်သော အမှုန်သေးများ၊ အဆုတ်နှင့် နှလုံးကို ထိခိုက်စေသည်။ |
| smoke | before | Buy N95 masks for everyone at home; cloth masks do not filter PM2.5. | အိမ်ရှိလူတိုင်းအတွက် N95 နှာခေါင်းစည်း ဝယ်ထားပါ။ အထည်နှာခေါင်းစည်းများက PM2.5 ကို မစစ်ထုတ်နိုင်ပါ။ |
| smoke | before | Pick one room to seal and run an air purifier in. | အလုံပိတ်ပြီး လေသန့်စက် ဖွင့်ထားရန် အခန်းတစ်ခန်းကို ရွေးထားပါ။ |
| smoke | before | Keep asthma and heart medicine stocked. | ပန်းနာရင်ကျပ်ဆေးနှင့် နှလုံးရောဂါဆေးများကို လုံလောက်စွာ စုထားပါ။ |
| smoke | before | Check PM2.5 each morning before going out. | အပြင်မထွက်မီ မနက်တိုင်း PM2.5 ကို စစ်ဆေးပါ။ |
| smoke | after | Air out your home once PM2.5 drops below 37.5 µg/m³. | PM2.5 သည် 37.5 µg/m³ အောက်သို့ ကျသွားမှ အိမ်ကို လေဝင်လေထွက် ဖွင့်ပေးပါ။ |
| smoke | after | Change or clean air purifier filters. | လေသန့်စက်၏ စစ်ထုတ်ကိရိယာ (filter) ကို လဲပါ သို့မဟုတ် သန့်ရှင်းပါ။ |
| smoke | after | Report burning you see to local authorities. | တွေ့ရသော မီးရှို့မှုများကို ဒေသအာဏာပိုင်များထံ သတင်းပို့ပါ။ |
| smoke | after | Keep spare masks for the next haze season. | နောက်မြူမှိုင်းရာသီအတွက် အပိုနှာခေါင်းစည်းများ သိမ်းထားပါ။ |
| heat | title | Extreme heat | အပူလွန်ကဲခြင်း |
| heat | summary | Heat that can cause heatstroke, mostly March to May. | အပူလျှပ်ခြင်း (heatstroke) ဖြစ်စေနိုင်သော အပူဒဏ်၊ အများအားဖြင့် မတ်လမှ မေလအထိ။ |
| heat | before | Plan outdoor work for early morning or evening. | အပြင်အလုပ်များကို မနက်စောစော သို့မဟုတ် ညနေပိုင်းတွင် လုပ်ရန် စီစဉ်ပါ။ |
| heat | before | Find a cool place nearby: a mall, library or temple hall. | အနီးရှိ အေးမြသောနေရာ (ဥပမာ ဈေးဝယ်စင်တာ၊ စာကြည့်တိုက် သို့မဟုတ် ဘုန်းကြီးကျောင်းဇရပ်) ကို ရှာထားပါ။ |
| heat | before | Check that older relatives have a fan or air conditioning. | သက်ကြီးရွယ်အို ဆွေမျိုးများတွင် ပန်ကာ သို့မဟုတ် လေအေးပေးစက် ရှိမရှိ စစ်ဆေးပါ။ |
| heat | before | Keep oral rehydration salts at home. | ဓာတ်ဆား (ORS) ကို အိမ်တွင် အသင့်ထားပါ။ |
| heat | after | Keep drinking water for the rest of the day. | ကျန်သည့်နေ့တစ်လျှောက် ရေဆက်သောက်ပါ။ |
| heat | after | Check on neighbours who live alone. | တစ်ယောက်တည်း နေသော အိမ်နီးချင်းများ အဆင်ပြေမပြေ စစ်ဆေးကြည့်ရှုပါ။ |
| heat | after | Rest in the shade before going back to hard work. | အလုပ်ကြမ်း ပြန်မလုပ်မီ အရိပ်တွင် အနားယူပါ။ |
| heat | after | Watch for headaches or cramps the next day. | နောက်နေ့တွင် ခေါင်းကိုက်ခြင်း သို့မဟုတ် ကြွက်တက်ခြင်း ရှိမရှိ သတိထားပါ။ |
| earthquake | title | Earthquake | ငလျင် |
| earthquake | summary | Shaking from faults in the north and west, or from Myanmar. | မြောက်ပိုင်းနှင့် အနောက်ပိုင်းရှိ ပြတ်ရွေ့များ သို့မဟုတ် မြန်မာနိုင်ငံမှ ဖြစ်ပေါ်သော လှုပ်ခတ်မှု။ |
| earthquake | before | Fix tall furniture and shelves to the wall. | အရပ်မြင့်သော ပရိဘောဂများနှင့် စင်များကို နံရံနှင့် ခိုင်မြဲစွာ တွဲတပ်ထားပါ။ |
| earthquake | before | Practise Drop, Cover, Hold On with your family. | မိသားစုနှင့်အတူ “ဝပ်၊ ကွယ်၊ ကိုင်” (Drop, Cover, Hold On) ကို လေ့ကျင့်ပါ။ |
| earthquake | before | Know how to turn off gas and electricity. | ဂက်စ်နှင့် လျှပ်စစ်မီးကို ပိတ်နည်း သိထားပါ။ |
| earthquake | before | Agree on a meeting point outside your building. | အဆောက်အအုံ အပြင်ဘက်တွင် တွေ့ဆုံရမည့် နေရာတစ်ခုကို မိသားစုနှင့် သဘောတူထားပါ။ |
| earthquake | after | Expect aftershocks; leave damaged buildings. | နောက်ဆက်တွဲ ငလျင်လှုပ်ခတ်မှုများ ရှိနိုင်သည်။ ပျက်စီးနေသော အဆောက်အအုံများမှ ထွက်ခွာပါ။ |
| earthquake | after | Check for gas leaks; do not use flames. | ဂက်စ်ယိုစိမ့်မှု ရှိမရှိ စစ်ဆေးပါ။ မီးမညှိပါနှင့်။ |
| earthquake | after | On the Andaman coast, move inland in case of a tsunami. | အန္ဒမန်ကမ်းရိုးတန်းတွင် ရှိလျှင် ဆူနာမီ ဖြစ်နိုင်သဖြင့် ကုန်းတွင်းဘက်သို့ ရွှေ့ပါ။ |
| earthquake | after | Send a text instead of calling so lines stay free. | ဖုန်းလိုင်းများ မပိတ်ဆို့စေရန် ဖုန်းခေါ်မည့်အစား စာတို ပို့ပါ။ |
| tsunami | title | Tsunami | ဆူနာမီ |
| tsunami | summary | Giant waves on the Andaman coast after a large undersea quake. | ပင်လယ်အောက် ငလျင်ကြီး လှုပ်ပြီးနောက် အန္ဒမန်ကမ်းရိုးတန်းသို့ ရိုက်ခတ်သော လှိုင်းကြီးများ။ |
| tsunami | before | Learn the tsunami evacuation signs near the beach. | ကမ်းခြေအနီးရှိ ဆူနာမီ ဘေးလွတ်ရာ ရွှေ့ပြောင်းရေး ဆိုင်းဘုတ်များကို မှတ်သားထားပါ။ |
| tsunami | before | Know the nearest high ground or tall concrete building. | အနီးဆုံး မြင့်သောနေရာ သို့မဟုတ် အမြင့် ကွန်ကရစ် အဆောက်အအုံကို သိထားပါ။ |
| tsunami | before | Keep a go-bag ready if you live on the coast. | ကမ်းရိုးတန်းတွင် နေထိုင်လျှင် အရေးပေါ်အိတ်ကို အသင့်ထားပါ။ |
| tsunami | before | Know the sound of the warning tower in your area. | သင့်ဒေသရှိ သတိပေးမျှော်စင်၏ အချက်ပေးသံကို မှတ်မိအောင် လုပ်ထားပါ။ |
| tsunami | after | Stay on high ground; more waves can follow for hours. | နာရီပေါင်းများစွာ လှိုင်းများ ထပ်လာနိုင်သဖြင့် မြင့်သောနေရာတွင်သာ ဆက်နေပါ။ |
| tsunami | after | Return only after an official all-clear. | ဘေးကင်းပြီဟု တရားဝင် ကြေညာပြီးမှသာ ပြန်ပါ။ |
| tsunami | after | Stay out of damaged buildings and floodwater. | ပျက်စီးနေသော အဆောက်အအုံများနှင့် ရေကြီးရေထဲသို့ မဝင်ပါနှင့်။ |
| tsunami | after | Help others only when you are safe yourself. | ကိုယ်တိုင် ဘေးကင်းမှသာ အခြားသူများကို ကူညီပါ။ |
| landslide | title | Landslide | မြေပြိုခြင်း |
| landslide | summary | Slopes give way after days of heavy rain. | ရက်ပေါင်းများစွာ မိုးသည်းထန်စွာ ရွာပြီးနောက် တောင်စောင်းများ ပြိုကျခြင်း။ |
| landslide | before | Know if your home is on or below a steep slope. | သင့်အိမ်သည် မတ်စောက်သော တောင်စောင်းပေါ် သို့မဟုတ် အောက်တွင် ရှိမရှိ သိထားပါ။ |
| landslide | before | Watch for new cracks in walls, ground or roads. | နံရံ၊ မြေပြင် သို့မဟုတ် လမ်းများတွင် အက်ကြောင်းအသစ်များ ရှိမရှိ စောင့်ကြည့်ပါ။ |
| landslide | before | Plan a route away from slopes and valleys. | တောင်စောင်းများနှင့် ချိုင့်ဝှမ်းများမှ ဝေးသော လမ်းကြောင်းကို စီစဉ်ထားပါ။ |
| landslide | before | Follow heavy rain warnings closely. | မိုးသည်းထန်မှု သတိပေးချက်များကို အနီးကပ် စောင့်ကြည့်ပါ။ |
| landslide | after | Stay away from the slide area; more can fall. | ထပ်ပြိုနိုင်သဖြင့် မြေပြိုသည့်နေရာမှ ဝေးဝေးနေပါ။ |
| landslide | after | Report broken roads, power and water lines. | ပျက်စီးနေသော လမ်းများ၊ ဓာတ်ကြိုးများနှင့် ရေပိုက်လိုင်းများကို သတင်းပို့ပါ။ |
| landslide | after | Watch for flooding below the slide. | မြေပြိုသည့်နေရာ၏ အောက်ဘက်တွင် ရေကြီးနိုင်သည်ကို သတိထားပါ။ |
| landslide | after | Have the slope checked before going home. | အိမ်မပြန်မီ တောင်စောင်းကို ကျွမ်းကျင်သူဖြင့် စစ်ဆေးခိုင်းပါ။ |
| drought | title | Drought | မိုးခေါင်ခြင်း |
| drought | summary | Long dry spells that cut water for homes and farms. | အိမ်သုံးရေနှင့် စိုက်ပျိုးရေးသုံးရေ ပြတ်လပ်စေသော ကြာရှည်ခြောက်သွေ့သည့်ကာလ။ |
| drought | before | Fix leaking taps and pipes. | ယိုစိမ့်နေသော ရေပိုက်ခေါင်းများနှင့် ပိုက်များကို ပြင်ပါ။ |
| drought | before | Store drinking water in clean, closed containers. | သောက်ရေကို အဖုံးပါသော သန့်ရှင်းသည့် ရေခံပုံးများတွင် သိုလှောင်ပါ။ |
| drought | before | Learn your area's water supply schedule. | သင့်ဒေသ၏ ရေပေးဝေချိန် ဇယားကို သိထားပါ။ |
| drought | before | Farmers: ask the local office about drought-tolerant crops. | တောင်သူများ- မိုးခေါင်ဒဏ်ခံနိုင်သော သီးနှံများအကြောင်း ဒေသဆိုင်ရာ ရုံးတွင် မေးမြန်းပါ။ |
| drought | after | Keep saving water until reservoirs recover. | ရေလှောင်ကန်များ ပုံမှန်ပြန်ဖြစ်သည်အထိ ရေကို ဆက်လက် ချွေတာပါ။ |
| drought | after | Clean stored water containers. | ရေသိုလှောင်ထားသော ပုံးများကို သန့်ရှင်းပါ။ |
| drought | after | Ask about government drought relief. | အစိုးရ၏ မိုးခေါင်ရေရှား ကူညီထောက်ပံ့မှုအကြောင်း မေးမြန်းပါ။ |
| drought | after | Plan rainwater collection for next season. | နောက်ရာသီအတွက် မိုးရေစုဆောင်းရန် စီစဉ်ပါ။ |
| chemical | title | Chemical incident | ဓာတုပစ္စည်း အန္တရာယ် |
| chemical | summary | Leaks, fires or spills at factories and on roads. | စက်ရုံများနှင့် လမ်းများပေါ်တွင် ဓာတုပစ္စည်း ယိုစိမ့်ခြင်း၊ မီးလောင်ခြင်း သို့မဟုတ် ဖိတ်စင်ခြင်း။ |
| chemical | before | Know if you live near factories or chemical storage. | စက်ရုံများ သို့မဟုတ် ဓာတုပစ္စည်း သိုလှောင်ရုံများ အနီးတွင် နေထိုင်ခြင်း ရှိမရှိ သိထားပါ။ |
| chemical | before | Keep tape and a plastic sheet to seal a room. | အခန်းကို အလုံပိတ်ရန် တိပ်နှင့် ပလတ်စတစ်စကို အသင့်ထားပါ။ |
| chemical | before | Know two ways out of your area. | သင့်ဒေသမှ ထွက်နိုင်သော လမ်းကြောင်း 2 ခုကို သိထားပါ။ |
| chemical | before | Save {disaster} and {fire} in your phone. | {disaster} နှင့် {fire} ကို ဖုန်းထဲတွင် သိမ်းထားပါ။ |
| chemical | after | Return only when officials say the air is safe. | လေထု ဘေးကင်းပြီဟု တာဝန်ရှိသူများက ပြောမှသာ ပြန်ပါ။ |
| chemical | after | Take off and bag exposed clothes; wash your skin with soap and water. | ဓာတုပစ္စည်း ထိခဲ့သော အဝတ်များကို ချွတ်ပြီး အိတ်ထဲထည့်ပိတ်ပါ။ အရေပြားကို ဆပ်ပြာနှင့် ရေဖြင့် ဆေးပါ။ |
| chemical | after | See a doctor if your eyes, skin or breathing hurt. | မျက်လုံး၊ အရေပြား သို့မဟုတ် အသက်ရှူရာတွင် နာကျင်လျှင် ဆရာဝန်ပြပါ။ |
| chemical | after | Do not eat garden vegetables until they are checked. | ခြံထွက် ဟင်းသီးဟင်းရွက်များကို စစ်ဆေးပြီးမှသာ စားပါ။ |
| cold | title | Extreme cold | အအေးလွန်ကဲခြင်း |
| cold | summary | Severe cold and wind chill that can cause frostbite and hypothermia. | အရေပြား အေးခဲပျက်စီးခြင်း (frostbite) နှင့် ကိုယ်အပူချိန် အလွန်ကျခြင်း (hypothermia) ကို ဖြစ်စေနိုင်သော ပြင်းထန်သည့် အအေးဓာတ်နှင့် လေအေး။ |
| cold | before | Dress in layers, with a hat, gloves and windproof outer layer. | ဦးထုပ်၊ လက်အိတ်နှင့် လေလုံသော အပြင်အင်္ကျီ အပါအဝင် အဝတ်ကို အထပ်ထပ် ဝတ်ပါ။ |
| cold | before | Keep a phone power bank charged. | ဖုန်းအတွက် ပါဝါဘဏ်ကို အားပြည့်ထားပါ။ |
| cold | before | Check on elderly neighbours. | သက်ကြီးရွယ်အို အိမ်နီးချင်းများ အဆင်ပြေမပြေ စစ်ဆေးကြည့်ရှုပါ။ |
| cold | before | Keep some food and water at home in case of power cuts. | မီးပြတ်ခဲ့လျှင်အတွက် အစားအစာနှင့် ရေ အချို့ကို အိမ်တွင် ထားပါ။ |
| cold | after | Warm frostbitten skin slowly with lukewarm water, not hot, and don't rub it. | အေးခဲပျက်စီးသော အရေပြားကို ရေနွေးနွေး (ရေပူ မဟုတ်) ဖြင့် ဖြည်းဖြည်း နွေးပေးပါ။ မပွတ်ပါနှင့်။ |
| cold | after | Check pipes and heating. | ရေပိုက်များနှင့် အပူပေးစနစ်ကို စစ်ဆေးပါ။ |
| cold | after | Follow {officials} and local announcements. | {officials} နှင့် ဒေသဆိုင်ရာ ကြေညာချက်များကို လိုက်နာပါ။ |
| snow | title | Heavy snow | နှင်းထူထပ်စွာ ကျခြင်း |
| snow | summary | Heavy snowfall that blocks roads and cuts power. | လမ်းများကို ပိတ်ဆို့ပြီး မီးပြတ်စေသော နှင်းထူထပ်စွာ ကျခြင်း။ |
| snow | before | Keep a shovel, warm clothes and food at home. | ဂေါ်ပြား၊ နွေးထွေးသော အဝတ်များနှင့် အစားအစာကို အိမ်တွင် ထားပါ။ |
| snow | before | In a car, carry a blanket, water, a torch and a charged phone. | ကားထဲတွင် စောင်၊ ရေ၊ ဓာတ်မီးနှင့် အားပြည့်ဖုန်း ထည့်ထားပါ။ |
| snow | before | Plan to stay home if {officials} warn. | {officials} က သတိပေးလျှင် အိမ်တွင်နေရန် စီစဉ်ပါ။ |
| snow | after | Clear snow carefully and take breaks (heart strain). | နှင်းကို ဂရုတစိုက် ကော်ပါ၊ ခဏခဏ နားပါ (နှလုံးကို ဝန်ပိစေသည်)။ |
| snow | after | Check on neighbours. | အိမ်နီးချင်းများ အဆင်ပြေမပြေ စစ်ဆေးကြည့်ရှုပါ။ |
| snow | after | Keep roofs and vents clear. | အမိုးများနှင့် လေဝင်ပေါက်များကို နှင်းကင်းအောင် ရှင်းထားပါ။ |
| go-bag | item / note | Water: 2 litres per person in the bag, more stored at home | သောက်ရေ- အိတ်ထဲတွင် တစ်ဦးလျှင် 2 လီတာ၊ အိမ်တွင် ထပ်ဆောင်း သိုလှောင်ထားရန် |
| go-bag | item / note | Ready-to-eat food for 3 days | ချက်ချင်းစားနိုင်သော အစားအစာ 3 ရက်စာ |
| go-bag | item / note | Medicine for 7 days and copies of prescriptions | ဆေးဝါး 7 ရက်စာနှင့် ဆေးစာ မိတ္တူများ |
| go-bag | item / note | Copies of ID card, passport and house registration in a waterproof bag | မှတ်ပုံတင်ကတ်၊ နိုင်ငံကူးလက်မှတ်နှင့် အိမ်ထောင်စုစာရင်း မိတ္တူများ (ရေလုံအိတ်ထဲတွင်) |
| go-bag | item / note | Phone, charger and a full power bank | ဖုန်း၊ အားသွင်းကြိုးနှင့် အားပြည့် ပါဝါဘဏ် |
| go-bag | item / note | Torch and spare batteries | လက်နှိပ်ဓာတ်မီးနှင့် အပိုဓာတ်ခဲများ |
| go-bag | item / note | Battery or wind-up radio | ဓာတ်ခဲသုံး သို့မဟုတ် လက်လှည့် ရေဒီယို |
| go-bag | item / note | First-aid kit | ရှေးဦးသူနာပြုစုရေး ပစ္စည်းအိတ် |
| go-bag | item / note | Cash in small notes | တန်ဖိုးနည်း ငွေစက္ကူဖြင့် လက်ငင်းငွေ |
| go-bag | item / note | Change of clothes and a rain jacket | အပိုအဝတ်အစားနှင့် မိုးကာအင်္ကျီ |
| go-bag | item / note | Soap, toothbrush and sanitary items | ဆပ်ပြာ၊ သွားတိုက်တံနှင့် တစ်ကိုယ်ရေသန့်ရှင်းရေး ပစ္စည်းများ |
| go-bag | item / note | Blanket or sleeping mat | စောင် သို့မဟုတ် အိပ်ဖျာ |
| go-bag | item / note | Paper list of family phone numbers | မိသားစု ဖုန်းနံပါတ်များကို စာရွက်ပေါ်တွင် ရေးထားသော စာရင်း |
| go-bag | item / note | Whistle to call for help | အကူအညီတောင်းရန် ခရာ (ဝီစီ) |
| go-bag | item / note | N95 masks | N95 နှာခေါင်းစည်းများ |
| go-bag | item / note | Waterproof bags for documents and phone | စာရွက်စာတမ်းနှင့် ဖုန်းအတွက် ရေလုံအိတ်များ |
| go-bag | item / note | Plastic sheet and strong tape | ပလတ်စတစ်စနှင့် ခိုင်ခံ့သော တိပ် |
| go-bag | item / note | Sturdy closed shoes | ခိုင်ခံ့ပြီး ခြေချောင်းလုံသော ဖိနပ် |
| go-bag | item / note | Rubber boots | ရော်ဘာ ဘွတ်ဖိနပ် |
| go-bag | item / note | Rope (10 m) | ကြိုး (10 မီတာ) |
| go-bag | item / note | Spare batteries | အပိုဓာတ်ခဲများ |
| go-bag | item / note | Eye drops | မျက်စဉ်း |
| go-bag | item / note | Spare air-purifier filter | လေသန့်စက်အတွက် အပို စစ်ထုတ်ကိရိယာ (filter) |
| go-bag | item / note | Oral rehydration salts | ဓာတ်ဆား (ORS) |
| go-bag | item / note | Wide-brimmed hat | အနားကျယ် ဦးထုပ် |
| go-bag | item / note | Cooling towel | အအေးပေး လက်ကိုင်ပဝါ |
| go-bag | item / note | Sunscreen | နေလောင်ကာ ခရင်မ် |
| go-bag | item / note | Work gloves | အလုပ်သုံး လက်အိတ် |
| go-bag | item / note | Dust masks | ဖုန်မှုန့်ကာ နှာခေါင်းစည်းများ |
| go-bag | item / note | Warm layers and a windproof jacket | နွေးထွေးသော အထပ်ထပ်ဝတ် အဝတ်များနှင့် လေလုံ ဂျာကင် |
| go-bag | item / note | Hat, gloves and scarf | ဦးထုပ်၊ လက်အိတ်နှင့် လည်ပင်းပတ်ပုဝါ |
| go-bag | item / note | Charged power bank | အားပြည့် ပါဝါဘဏ် |
| go-bag | item / note | Hand warmers | လက်နွေးကိရိယာ (hand warmer) |
| go-bag | item / note | Thermos for a hot drink | ပူပူနွေးနွေး သောက်စရာအတွက် ဓာတ်ဘူး |
| go-bag | item / note | Wet wipes | စိုစွတ်သော တစ်ရှူး |
| go-bag | item / note | Spare clothes in a sealed bag | အလုံပိတ်အိတ်ထဲရှိ အပိုအဝတ်များ |
| go-bag | item / note | Masks do not stop chemical gases. Stay indoors with windows and doors sealed, or leave upwind if told to evacuate. | နှာခေါင်းစည်းများက ဓာတုဓာတ်ငွေ့ကို မကာကွယ်နိုင်ပါ။ ပြတင်းပေါက်နှင့် တံခါးများကို အလုံပိတ်ပြီး အိမ်ထဲတွင် နေပါ၊ သို့မဟုတ် ဘေးလွတ်ရာသို့ ရွှေ့ပြောင်းရန် အကြောင်းကြားလျှင် လေညာဘက် (လေတိုက်လာသည့်ဘက်) သို့ ထွက်ခွာပါ။ |
| go-bag | item / note | Keep this bag by the door. If the warning comes, go on foot right away. Don't stop to pack. | ဤအိတ်ကို တံခါးအနီးတွင် ထားပါ။ သတိပေးချက် ထွက်လာလျှင် ခြေလျင် ချက်ချင်း ထွက်ပါ။ ပစ္စည်းထုပ်ပိုးရန် မရပ်ပါနှင့်။ |

## 3. Screen text (UI)

| Key | English | မြန်မာ |
|---|---|---|
| `app_name` | DEMS | DEMS |
| `tabs_label` | Main | ပင်မ |
| `nav_home` | Home | ပင်မစာမျက်နှာ |
| `nav_map` | Map | မြေပုံ |
| `nav_shelters` | Shelters | ခိုလှုံရာ |
| `nav_report` | Report | သတင်းပို့ |
| `nav_info` | Info | အချက်အလက် |
| `assistant_button` | Assistant | အကူအညီပေးသူ |
| `assistant_title` | Assistant | အကူအညီပေးသူ |
| `assistant_coming_soon` | Coming soon: an emergency-information assistant that runs on your device, even without internet. | မကြာမီ ရောက်လာမည်- အင်တာနက်မရှိလည်း သင့်ဖုန်းပေါ်တွင် အလုပ်လုပ်သော အရေးပေါ် သတင်းအချက်အလက် အကူအညီပေးသူ။ |
| `close` | Close | ပိတ်ရန် |
| `loading` | Loading… | ဖွင့်နေသည်… |
| `sample` | SAMPLE | နမူနာ |
| `sample_hint` | Sample data from this demo's database, not real. | ဤ demo ၏ ဒေတာဘေ့စ်မှ နမူနာဒေတာ ဖြစ်ပြီး အမှန်တကယ် မဟုတ်ပါ။ |
| `source_updated` | {source} · updated {time} | {source} · {time} တွင် အပ်ဒိတ်လုပ်ခဲ့သည် |
| `source_unavailable` | {source} unavailable right now. | {source} ကို ယခု မရရှိနိုင်ပါ။ |
| `retry` | Try again | ထပ်ကြိုးစားရန် |
| `offline_banner` | Showing sample data: backend offline. | နမူနာဒေတာ ပြသနေသည်- ဆာဗာ အော့ဖ်လိုင်း ဖြစ်နေသည်။ |
| `banner_none` | No active warnings for Thailand right now. | ယခုအချိန်တွင် ထိုင်းနိုင်ငံအတွက် သတိပေးချက် မရှိပါ။ |
| `banner_live_source` | GDACS alert | GDACS သတိပေးချက် |
| `map_unavailable` | Map can't be shown on this device. | ဤစက်ပေါ်တွင် မြေပုံကို ပြသ၍ မရပါ။ |
| `sheet_toggle` | Expand or collapse panel | အကွက်ကို ချဲ့ရန် သို့မဟုတ် ချုံ့ရန် |
| `home_find_shelter` | Find nearest shelter | အနီးဆုံး ခိုလှုံရာနေရာကို ရှာရန် |
| `home_shelter_distance` | {km} km away | {km} ကီလိုမီတာ အကွာ |
| `home_no_shelter` | No open shelters with a known location. | တည်နေရာ သိရှိထားသော ဖွင့်ထားသည့် ခိုလှုံရာနေရာ မရှိပါ။ |
| `home_evacuation` | Evacuation | ဘေးလွတ်ရာ ရွှေ့ပြောင်းခြင်း |
| `home_report` | Report incident | ဖြစ်စဉ် သတင်းပို့ရန် |
| `home_weather` | Weather | မိုးလေဝသ |
| `home_conditions` | Conditions here | ဤနေရာ၏ အခြေအနေ |
| `home_nearby_events` | Recent events | မကြာသေးမီ ဖြစ်ရပ်များ |
| `location_label` | Location | တည်နေရာ |
| `location_use_gps` | Use my location | ကျွန်ုပ်၏ တည်နေရာကို သုံးရန် |
| `location_pick` | Choose an area | ဒေသတစ်ခု ရွေးရန် |
| `location_default` | {city} (default) | {city} (မူလ) |
| `location_gps` | Your location | သင့်တည်နေရာ |
| `location_denied` | Location unavailable. Choose an area instead. | တည်နေရာ မရရှိနိုင်ပါ။ ဒေသတစ်ခုကို ရွေးပါ။ |
| `pm25_title` | Air quality (PM2.5) | လေထုအရည်အသွေး (PM2.5) |
| `pm25_band_very_good` | Very good | အလွန်ကောင်း |
| `pm25_band_good` | Good | ကောင်း |
| `pm25_band_moderate` | Moderate | အသင့်အတင့် |
| `pm25_band_unhealthy_some` | Starting to affect health | ကျန်းမာရေးကို စတင်ထိခိုက် |
| `pm25_band_unhealthy` | Affects health | ကျန်းမာရေးကို ထိခိုက် |
| `rain_title` | Rain chance (24 h) | မိုးရွာနိုင်ခြေ (24 နာရီ) |
| `river_title` | River flow (model) | မြစ်ရေစီးဆင်းမှု (မော်ဒယ်) |
| `river_rising` | Rising: peak {peak} m³/s on {date} | မြင့်တက်နေသည်- {date} တွင် အမြင့်ဆုံး {peak} m³/s |
| `river_steady` | Steady: about {today} m³/s | တည်ငြိမ်- ခန့်မှန်း {today} m³/s |
| `river_none` | No river model data for this spot. | ဤနေရာအတွက် မြစ်မော်ဒယ် ဒေတာ မရှိပါ။ |
| `river_note` | GloFAS model forecast, not an official flood warning. | GloFAS မော်ဒယ် ခန့်မှန်းချက်သာ ဖြစ်ပြီး တရားဝင် ရေကြီးသတိပေးချက် မဟုတ်ပါ။ |
| `events_live` | Live sources | တိုက်ရိုက် ရင်းမြစ်များ |
| `events_sample` | From this demo's database | ဤ demo ၏ ဒေတာဘေ့စ်မှ |
| `events_empty` | No events in the last 12 months. | ပြီးခဲ့သော 12 လအတွင်း ဖြစ်ရပ် မရှိပါ။ |
| `filter_all` | All | အားလုံး |
| `filter_label` | Filter by type | အမျိုးအစားအလိုက် စစ်ထုတ်ရန် |
| `kind_flood` | Flood | ရေကြီးခြင်း |
| `kind_cyclone` | Tropical cyclone | အပူပိုင်းဆိုင်ကလုန်း |
| `kind_earthquake` | Earthquake | ငလျင် |
| `kind_drought` | Drought | မိုးခေါင်ခြင်း |
| `kind_wildfire` | Wildfire | တောမီး |
| `kind_volcano` | Volcano | မီးတောင် |
| `kind_other` | Other | အခြား |
| `level_info` | Info | အချက်အလက် |
| `level_watch` | Watch | စောင့်ကြည့် |
| `level_warning` | Warning | သတိပေး |
| `level_danger` | Danger | အန္တရာယ် |
| `view_list` | List | စာရင်း |
| `view_map` | Map | မြေပုံ |
| `view_label` | View | ကြည့်ပုံ |
| `open_source_link` | Details at source | ရင်းမြစ်တွင် အသေးစိတ်ကြည့်ရန် |
| `event_current` | Ongoing | ဖြစ်ပွားဆဲ |
| `disasters_title` | Disasters & hazards | ဘေးအန္တရာယ်များ |
| `shelters_title` | Shelters | ခိုလှုံရာနေရာများ |
| `shelters_sample_note` | Every shelter on this page is sample data. | ဤစာမျက်နှာရှိ ခိုလှုံရာနေရာ အားလုံးသည် နမူနာဒေတာ ဖြစ်သည်။ |
| `shelter_capacity` | {occupied} / {capacity} people | {occupied} / {capacity} ဦး |
| `shelter_distance_unknown` | Distance unknown | အကွာအဝေး မသိပါ |
| `shelter_status_available` | Open | ဖွင့်ထားသည် |
| `shelter_status_full` | Full | ပြည့်နေသည် |
| `shelter_status_closed` | Closed | ပိတ်ထားသည် |
| `shelter_status_maintenance` | Under maintenance | ပြုပြင်နေသည် |
| `shelter_directions` | Directions | လမ်းညွှန် |
| `shelter_on_map` | Show on map | မြေပုံပေါ်တွင် ပြရန် |
| `evac_title` | Evacuation | ဘေးလွတ်ရာ ရွှေ့ပြောင်းခြင်း |
| `evac_intro` | Head to the nearest open shelter. Directions open in your phone's maps app. | အနီးဆုံး ဖွင့်ထားသော ခိုလှုံရာနေရာသို့ သွားပါ။ လမ်းညွှန်ကို သင့်ဖုန်း၏ မြေပုံအက်ပ်တွင် ဖွင့်ပေးမည်။ |
| `evac_routes` | Planned routes | စီစဉ်ထားသော လမ်းကြောင်းများ |
| `evac_route_meta` | {km} km · about {min} min · {status} | {km} ကီလိုမီတာ · ခန့်မှန်း {min} မိနစ် · {status} |
| `evac_nearest` | Nearest open shelters | အနီးဆုံး ဖွင့်ထားသော ခိုလှုံရာနေရာများ |
| `weather_title` | Weather | မိုးလေဝသ |
| `weather_now` | Now | ယခု |
| `weather_next24` | Next 24 hours | နောက် 24 နာရီ |
| `weather_7day` | 7 days | 7 ရက် |
| `weather_wind` | Wind {speed} km/h | လေ {speed} km/h |
| `weather_rain_mm` | {mm} mm | {mm} မီလီမီတာ |
| `wx_clear` | Clear | ကြည်လင် |
| `wx_mainly_clear` | Partly cloudy | တိမ်အနည်းငယ် |
| `wx_overcast` | Cloudy | တိမ်ထူ |
| `wx_fog` | Fog | မြူ |
| `wx_drizzle` | Drizzle | မိုးဖွဲ |
| `wx_rain` | Rain | မိုးရွာ |
| `wx_snow` | Snow | နှင်းကျ |
| `wx_thunder` | Thunderstorm | မိုးကြိုးမုန်တိုင်း |
| `report_title` | Report an incident | ဖြစ်စဉ် သတင်းပို့ရန် |
| `report_step` | Step {n} of 3 | အဆင့် {n} / 3 |
| `report_what` | What happened? | ဘာဖြစ်ခဲ့သလဲ။ |
| `report_type_label` | Type | အမျိုးအစား |
| `rtype_flood` | Flood | ရေကြီးခြင်း |
| `rtype_earthquake` | Earthquake | ငလျင် |
| `rtype_fire` | Fire | မီးလောင်ခြင်း |
| `rtype_storm` | Storm | မုန်တိုင်း |
| `rtype_landslide` | Landslide | မြေပြိုခြင်း |
| `rtype_tsunami` | Tsunami | ဆူနာမီ |
| `rtype_drought` | Drought | မိုးခေါင်ခြင်း |
| `rtype_other` | Other | အခြား |
| `report_severity_label` | How serious? | ဘယ်လောက် ပြင်းထန်သလဲ။ |
| `rsev_minor` | Minor | အနည်းငယ် |
| `rsev_moderate` | Moderate | အသင့်အတင့် |
| `rsev_severe` | Severe | ပြင်းထန် |
| `rsev_critical` | Critical | အလွန်ပြင်းထန် |
| `report_description_label` | Describe what you see | သင်မြင်ရသည်ကို ဖော်ပြပါ |
| `report_where` | Where is it? | ဘယ်နေရာမှာလဲ။ |
| `report_location_label` | Place name or landmark | နေရာအမည် သို့မဟုတ် အမှတ်အသား |
| `report_use_gps` | Use my current location | ကျွန်ုပ်၏ လက်ရှိတည်နေရာကို သုံးရန် |
| `report_gps_set` | Location attached ({lat}, {lon}) | တည်နေရာ ပူးတွဲပြီး ({lat}, {lon}) |
| `report_contact` | Contact (optional) | ဆက်သွယ်ရန် (မဖြစ်မနေ မဟုတ်) |
| `report_name` | Name | အမည် |
| `report_email` | Email | အီးမေးလ် |
| `report_phone` | Phone | ဖုန်း |
| `report_contact_note` | Only the response team sees this. | ကယ်ဆယ်ရေးအဖွဲ့သာ ဤအချက်ကို မြင်ရမည်။ |
| `report_next` | Next | ရှေ့သို့ |
| `report_back` | Back | နောက်သို့ |
| `report_submit` | Send report | သတင်းပို့ချက် ပေးပို့ရန် |
| `report_sending` | Sending… | ပေးပို့နေသည်… |
| `report_done_title` | Report sent | သတင်းပို့ချက် ပေးပို့ပြီး |
| `report_done_body` | Thank you. If anyone is in danger right now, call {medical} or {police}. | ကျေးဇူးတင်ပါသည်။ ယခု အန္တရာယ်ရှိနေသူ ရှိလျှင် {medical} သို့မဟုတ် {police} ကို ဖုန်းခေါ်ပါ။ |
| `report_done_body_one` | Thank you. If anyone is in danger right now, call {num}. | ကျေးဇူးတင်ပါသည်။ ယခု အန္တရာယ်ရှိနေသူ ရှိလျှင် {num} ကို ဖုန်းခေါ်ပါ။ |
| `report_again` | Send another report | နောက်ထပ် သတင်းပို့ရန် |
| `report_error_offline` | Couldn't reach the server. Your report is still here; try again when you have signal. | ဆာဗာသို့ ဆက်သွယ်၍ မရပါ။ သင့်သတင်းပို့ချက် ဤနေရာတွင် ရှိနေဆဲ ဖြစ်သည်။ လိုင်းမိသောအခါ ထပ်ကြိုးစားပါ။ |
| `report_error_limited` | Too many reports in a short time. Please wait a few minutes and try again. | အချိန်တိုအတွင်း သတင်းပို့ချက် အများကြီး ဖြစ်နေသည်။ မိနစ်အနည်းငယ် စောင့်ပြီး ထပ်ကြိုးစားပါ။ |
| `report_error_rejected` | The server rejected the report. Please check the details and try again. | ဆာဗာက သတင်းပို့ချက်ကို လက်မခံပါ။ အသေးစိတ်ကို စစ်ဆေးပြီး ထပ်ကြိုးစားပါ။ |
| `report_required` | Please fill this in. | ဤအကွက်ကို ဖြည့်ပါ။ |
| `report_description_short` | Please write at least 10 characters. | အနည်းဆုံး စာလုံး 10 လုံး ရေးပါ။ |
| `emergency_call_first` | In danger now? Call {medical} (ambulance) or {police} (police) first. | ယခု အန္တရာယ်ရှိနေပါသလား။ {medical} (လူနာတင်ယာဉ်) သို့မဟုတ် {police} (ရဲ) ကို အရင်ဖုန်းခေါ်ပါ။ |
| `emergency_call_first_one` | In danger now? Call {num} first. | ယခု အန္တရာယ်ရှိနေပါသလား။ {num} ကို အရင်ဖုန်းခေါ်ပါ။ |
| `info_title` | Emergency info | အရေးပေါ် အချက်အလက် |
| `info_numbers` | Emergency numbers | အရေးပေါ် ဖုန်းနံပါတ်များ |
| `num_1784` | Disaster hotline (DDPM) | ဘေးအန္တရာယ် အရေးပေါ်ဖုန်း (DDPM) |
| `num_1669` | Ambulance & medical | လူနာတင်ယာဉ်နှင့် ဆေးကုသမှု |
| `num_191` | Police | ရဲ |
| `num_199` | Fire | မီးသတ် |
| `info_more` | More | နောက်ထပ် |
| `about_title` | About this demo | ဤ demo အကြောင်း |
| `about_intro` | DEMS is a student project. It is built like a real public tool, but it is not an official service. | DEMS သည် ကျောင်းသား ပရောဂျက်တစ်ခု ဖြစ်သည်။ တကယ့် အများပြည်သူသုံး ကိရိယာကဲ့သို့ တည်ဆောက်ထားသော်လည်း တရားဝင် ဝန်ဆောင်မှု မဟုတ်ပါ။ |
| `about_real` | Real (live public sources) | အမှန် (အများပြည်သူ တိုက်ရိုက် ရင်းမြစ်များ) |
| `about_sample` | Sample (this demo's own database) | နမူနာ (ဤ demo ၏ ကိုယ်ပိုင် ဒေတာဘေ့စ်) |
| `about_real_weather` | Weather, air quality, river flow: Open-Meteo | မိုးလေဝသ၊ လေထုအရည်အသွေး၊ မြစ်ရေစီးဆင်းမှု- Open-Meteo |
| `about_real_events` | Disaster alerts: GDACS | ဘေးအန္တရာယ် သတိပေးချက်များ- GDACS |
| `about_real_quakes` | Earthquakes: USGS | ငလျင်များ- USGS |
| `about_real_map` | Map: OpenFreeMap / OpenStreetMap contributors | မြေပုံ- OpenFreeMap / OpenStreetMap ပါဝင်ကူညီသူများ |
| `about_sample_shelters` | Thailand: example shelters (no public list exists). Myanmar: in development. Sweden: link to MCF's official civil-defence shelter map. | ထိုင်း- ဥပမာ ခိုလှုံရာနေရာများ (အများပြည်သူ စာရင်း မရှိပါ)။ မြန်မာ- ဖော်ဆောင်ဆဲ။ ဆွီဒင်- MCF ၏ တရားဝင် အရပ်ဘက်ကာကွယ်ရေး ခိုလှုံရာ မြေပုံသို့ လင့်ခ်။ |
| `about_sample_disasters` | Disasters and alerts in the database | ဒေတာဘေ့စ်ရှိ ဘေးအန္တရာယ်များနှင့် သတိပေးချက်များ |
| `about_sample_routes` | Evacuation routes | ဘေးလွတ်ရာ ရွှေ့ပြောင်းရေး လမ်းကြောင်းများ |
| `about_reports` | Reports you send are stored in the demo database only and are not seen by any authority. | သင်ပို့သော သတင်းပို့ချက်များကို demo ဒေတာဘေ့စ်တွင်သာ သိမ်းဆည်းပြီး မည်သည့် အာဏာပိုင်ကမျှ မမြင်ရပါ။ |
| `about_th_note` | Thai translations are drafts awaiting native review. | ထိုင်းဘာသာပြန်များသည် မူကြမ်းများ ဖြစ်ပြီး မိခင်ဘာသာစကားပြောသူ၏ စစ်ဆေးမှုကို စောင့်ဆိုင်းနေသည်။ |
| `login_admin_title` | Admin sign in | စီမံခန့်ခွဲသူ ဝင်ရောက်ရန် |
| `login_volunteer_title` | Volunteer sign in | စေတနာ့ဝန်ထမ်း ဝင်ရောက်ရန် |
| `login_email` | Email | အီးမေးလ် |
| `login_username` | Username | အသုံးပြုသူအမည် |
| `login_password` | Password | စကားဝှက် |
| `login_submit` | Sign in | ဝင်ရောက်ရန် |
| `login_failed` | Email/username or password is incorrect. | အီးမေးလ်/အသုံးပြုသူအမည် သို့မဟုတ် စကားဝှက် မှားနေသည်။ |
| `login_wrong_role` | This account can't sign in here. | ဤအကောင့်ဖြင့် ဤနေရာတွင် ဝင်ရောက်၍ မရပါ။ |
| `login_required` | Please fill in both fields. | အကွက် နှစ်ခုလုံးကို ဖြည့်ပါ။ |
| `signed_in_as` | Signed in as {who} | {who} အဖြစ် ဝင်ရောက်ထားသည် |
| `sign_out` | Sign out | ထွက်ရန် |
| `admin_coming` | The admin console arrives in Phase 2. | စီမံခန့်ခွဲမှု ကွန်ဆိုးလ်သည် အဆင့် 2 တွင် ရောက်လာမည်။ |
| `volunteer_coming` | Volunteer tools arrive in Phase 3. | စေတနာ့ဝန်ထမ်း ကိရိယာများသည် အဆင့် 3 တွင် ရောက်လာမည်။ |
| `nav_now` | Now | ယခု |
| `nav_prepare` | Prepare | ပြင်ဆင်ရန် |
| `nav_more` | More | နောက်ထပ် |
| `live_label` | Live | တိုက်ရိုက် |
| `sos_aria` | Call {num}, emergency number | {num} ကို ဖုန်းခေါ်ရန်၊ အရေးပေါ်နံပါတ် |
| `demo_chip` | Demo | Demo |
| `demo_chip_aria` | About this demo and its data | ဤ demo နှင့် ၎င်း၏ ဒေတာအကြောင်း |
| `place_change` | Change location | တည်နေရာ ပြောင်းရန် |
| `search_label` | Search a province or shelter | ပြည်နယ်/တိုင်း သို့မဟုတ် ခိုလှုံရာနေရာ ရှာရန် |
| `first_visit_body` | DEMS is a student project. Levels are estimates from public data, not official warnings. Follow {officials} instructions. In an emergency call {sos}. | DEMS သည် ကျောင်းသား ပရောဂျက်တစ်ခု ဖြစ်သည်။ အဆင့်များသည် အများပြည်သူ ဒေတာမှ ခန့်မှန်းချက်များသာ ဖြစ်ပြီး တရားဝင် သတိပေးချက်များ မဟုတ်ပါ။ {officials} ၏ ညွှန်ကြားချက်များကို လိုက်နာပါ။ အရေးပေါ်အခြေအနေတွင် {sos} ကို ဖုန်းခေါ်ပါ။ |
| `first_visit_ok` | Got it | နားလည်ပါပြီ |
| `lvl_safe` | Safe | ဘေးကင်း |
| `lvl_watch` | Watch | စောင့်ကြည့် |
| `lvl_warning` | Warning | သတိပေး |
| `lvl_unknown` | Unknown | မသိရ |
| `haz_flood` | Flooding | ရေကြီးခြင်း |
| `haz_rain` | Heavy rain | မိုးသည်းထန်ခြင်း |
| `haz_storm` | Storm | မုန်တိုင်း |
| `haz_smoke` | Haze | မြူမှိုင်း |
| `haz_heat` | Extreme heat | အပူလွန်ကဲခြင်း |
| `haz_earthquake` | Earthquake | ငလျင် |
| `haz_tsunami` | Tsunami | ဆူနာမီ |
| `haz_landslide` | Landslide | မြေပြိုခြင်း |
| `haz_drought` | Drought | မိုးခေါင်ခြင်း |
| `haz_wildfire` | Wildfire | တောမီး |
| `haz_volcano` | Volcano | မီးတောင် |
| `haz_chemical` | Chemical spill | ဓာတုပစ္စည်း ယိုဖိတ်ခြင်း |
| `haz_official` | Official warning | တရားဝင် သတိပေးချက် |
| `haz_other` | Other hazard | အခြား အန္တရာယ် |
| `line_pm25` | PM2.5 {value} µg/m³ | PM2.5 {value} µg/m³ |
| `line_heat` | Feels like {value}°C today | ယနေ့ ခံစားရသော အပူချိန် {value}°C |
| `line_rain` | {value} mm of rain today | ယနေ့ မိုးရေ {value} မီလီမီတာ |
| `line_river` | River model shows a rise | မြစ်မော်ဒယ်တွင် ရေမြင့်တက်မှု ပြသည် |
| `line_quake` | M{mag} · {km} km away | M{mag} · {km} ကီလိုမီတာ အကွာ |
| `line_event` | {name} · {km} km away | {name} · {km} ကီလိုမီတာ အကွာ |
| `feed_air` | Air quality | လေထုအရည်အသွေး |
| `feed_forecast` | Forecast | ခန့်မှန်းချက် |
| `feed_river` | River model | မြစ်မော်ဒယ် |
| `feed_gdacs` | GDACS | GDACS |
| `feed_quakes` | Earthquakes | ငလျင်များ |
| `feed_smhi` | SMHI warnings | SMHI သတိပေးချက်များ |
| `official_badge` | Official: SMHI | တရားဝင်- SMHI |
| `now_updated` | updated {time} | {time} တွင် အပ်ဒိတ်လုပ်ခဲ့သည် |
| `now_safe_title` | No warnings near you | သင့်အနီးတွင် သတိပေးချက် မရှိပါ |
| `now_safe_body` | Nothing active near {place}. | {place} အနီးတွင် ဖြစ်ပွားနေသော အန္တရာယ် မရှိပါ။ |
| `now_unknown_title` | Status unknown | အခြေအနေ မသိရပါ |
| `now_unknown_body` | Couldn't reach the data sources. Last checked {time}. | ဒေတာရင်းမြစ်များသို့ ဆက်သွယ်၍ မရပါ။ နောက်ဆုံး စစ်ဆေးချိန် {time}။ |
| `now_unknown_never` | Couldn't reach the data sources yet. | ဒေတာရင်းမြစ်များသို့ မဆက်သွယ်နိုင်သေးပါ။ |
| `now_title_1` | {a} near you | သင့်အနီးတွင် {a} |
| `now_title_2` | {a} and {b} | {a} နှင့် {b} |
| `now_title_3` | {a}, {b} and {c} | {a}၊ {b} နှင့် {c} |
| `now_reason_1` | 1 active hazard near you. | သင့်အနီးတွင် ဖြစ်ပွားနေသော အန္တရာယ် 1 ခု။ |
| `now_reason_n` | {count} active hazards near you. The worst one sets the level. | သင့်အနီးတွင် ဖြစ်ပွားနေသော အန္တရာယ် {count} ခု။ အဆိုးဆုံးတစ်ခုက အဆင့်ကို သတ်မှတ်သည်။ |
| `now_partial` | Unavailable right now: {feeds}. | ယခု မရရှိနိုင်သည်- {feeds}။ |
| `now_guidance` | DEMS estimate from public data. Official warnings: {officials}. | အများပြည်သူ ဒေတာမှ DEMS ၏ ခန့်မှန်းချက်။ တရားဝင် သတိပေးချက်များ- {officials}။ |
| `now_quiet` | no risk here right now | ယခု ဤနေရာတွင် အန္တရာယ် မရှိ |
| `now_steps` | What to do now | ယခု ဘာလုပ်ရမလဲ |
| `now_shelter` | Nearest shelter | အနီးဆုံး ခိုလှုံရာနေရာ |
| `now_shelter_go` | Go to shelter now | ခိုလှုံရာနေရာသို့ ယခု သွားပါ |
| `now_shelter_sub` | {name} · {km} km | {name} · {km} ကီလိုမီတာ |
| `now_shelter_none` | Find a shelter | ခိုလှုံရာနေရာ ရှာရန် |
| `now_report` | Report something | တစ်ခုခု သတင်းပို့ရန် |
| `now_shelters` | Nearest shelters | အနီးဆုံး ခိုလှုံရာနေရာများ |
| `now_rain24` | Rain chance, next 24 h | မိုးရွာနိုင်ခြေ၊ နောက် 24 နာရီ |
| `now_recent` | Recent events | မကြာသေးမီ ဖြစ်ရပ်များ |
| `now_recent_none` | No recent events near you. | သင့်အနီးတွင် မကြာသေးမီ ဖြစ်ရပ် မရှိပါ။ |
| `tile_rain` | Rain today | ယနေ့ မိုးရေ |
| `tile_air` | Air PM2.5 | လေထု PM2.5 |
| `tile_river` | River | မြစ် |
| `tile_quakes` | Quakes 24 h | ငလျင် 24 နာရီ |
| `tile_rising` | Rising | မြင့်တက်နေ |
| `tile_normal` | Normal | ပုံမှန် |
| `tile_none` | None | မရှိ |
| `sample_tag` | Sample | နမူနာ |
| `hazard_source` | Source: {source} · {time} | ရင်းမြစ်- {source} · {time} |
| `hazard_distance` | {km} km from you | သင်နှင့် {km} ကီလိုမီတာ အကွာ |
| `hazard_sample_note` | Sample record from this demo's database. It never changes your level. | ဤ demo ၏ ဒေတာဘေ့စ်မှ နမူနာမှတ်တမ်း ဖြစ်သည်။ သင့်အဆင့်ကို ဘယ်တော့မှ မပြောင်းလဲစေပါ။ |
| `hazard_guide` | Read the full guide | လမ်းညွှန်အပြည့်အစုံ ဖတ်ရန် |
| `hazard_open_source` | Open source report | ရင်းမြစ် အစီရင်ခံစာ ဖွင့်ရန် |
| `now_all_shelters` | All shelters | ခိုလှုံရာနေရာ အားလုံး |
| `now_checking_title` | Checking hazards near you… | သင့်အနီးရှိ အန္တရာယ်များကို စစ်ဆေးနေသည်… |
| `map_layers` | Map layers | မြေပုံ အလွှာများ |
| `map_shelters` | Shelters | ခိုလှုံရာနေရာများ |
| `map_all_hazards` | Hazards in Thailand | ထိုင်းနိုင်ငံရှိ အန္တရာယ်များ |
| `map_none` | No hazards to show. | ပြရန် အန္တရာယ် မရှိပါ။ |
| `map_report` | Report | သတင်းပို့ |
| `map_list` | List | စာရင်း |
| `f_open` | Open | ဖွင့်ထားသည် |
| `f_space` | Has space | နေရာလွတ်ရှိ |
| `f_medical` | Medical | ဆေးကုသမှု |
| `f_pets` | Pets | အိမ်မွေးတိရစ္ဆာန် |
| `f_cleanAir` | Clean-air room | လေသန့်ခန်း |
| `shelters_filters` | Filter shelters | ခိုလှုံရာနေရာများကို စစ်ထုတ်ရန် |
| `shelters_none` | No shelters match these filters. | ဤစစ်ထုတ်ချက်များနှင့် ကိုက်ညီသော ခိုလှုံရာနေရာ မရှိပါ။ |
| `shelter_route` | Route | လမ်းကြောင်း |
| `shelter_gmaps` | Open in Google Maps | Google Maps တွင် ဖွင့်ရန် |
| `shelter_facilities` | Facilities | အထောက်အကူပြု ပစ္စည်းများ |
| `evac_list_title` | Evacuation routes | ဘေးလွတ်ရာ ရွှေ့ပြောင်းရေး လမ်းကြောင်းများ |
| `evac_line` | {from} → {to} · {km} km · {min} min | {from} → {to} · {km} ကီလိုမီတာ · {min} မိနစ် |
| `route_title` | Route to {name} | {name} သို့ လမ်းကြောင်း |
| `route_mode` | Travel mode | သွားလာမည့် နည်းလမ်း |
| `mode_foot` | Walk | လမ်းလျှောက် |
| `mode_car` | Drive | ကားမောင်း |
| `mode_bike` | Bike | စက်ဘီး |
| `route_summary` | {km} km · {min} min | {km} ကီလိုမီတာ · {min} မိနစ် |
| `route_avoided` | Avoids {count} hazard zones | အန္တရာယ်ဇုန် {count} ခုကို ရှောင်သည် |
| `route_not_avoided` | Couldn't route around hazard zones. Check conditions on the way. | အန္တရာယ်ဇုန်များကို ရှောင်သော လမ်းကြောင်း မရှာနိုင်ပါ။ လမ်းတစ်လျှောက် အခြေအနေကို စစ်ဆေးပါ။ |
| `route_steps` | Steps | အဆင့်များ |
| `route_start` | Start | စတင်ရန် |
| `route_stop` | Stop | ရပ်ရန် |
| `route_recalc` | You're off the route. Recalculate | လမ်းကြောင်းမှ လွဲနေသည်။ ပြန်တွက်ရန် |
| `route_loading` | Finding a safe route… | ဘေးကင်းသော လမ်းကြောင်း ရှာနေသည်… |
| `route_limited` | Too many route requests in a short time. Please wait a few minutes and try again. | အချိန်တိုအတွင်း လမ်းကြောင်း တောင်းဆိုမှု အများကြီး ဖြစ်နေသည်။ မိနစ်အနည်းငယ် စောင့်ပြီး ထပ်ကြိုးစားပါ။ |
| `route_outside` | Routing works inside Thailand only. | လမ်းကြောင်းရှာခြင်းသည် ထိုင်းနိုင်ငံအတွင်းသာ အလုပ်လုပ်သည်။ |
| `route_fallback` | Routing is unavailable right now. Straight-line distance: {km} km to the {dir}. | လမ်းကြောင်းရှာခြင်း ယခု မရနိုင်ပါ။ တည့်တည့်အကွာအဝေး- {dir} ဘက်သို့ {km} ကီလိုမီတာ။ |
| `route_no_dest` | Choose a shelter first. | ခိုလှုံရာနေရာကို အရင် ရွေးပါ။ |
| `route_pick_shelter` | Pick a shelter | ခိုလှုံရာနေရာ ရွေးရန် |
| `step_unnamed` | the road | လမ်း |
| `step_0` | Turn left onto {name} | {name} ပေါ်သို့ ဘယ်ကွေ့ပါ |
| `step_1` | Turn right onto {name} | {name} ပေါ်သို့ ညာကွေ့ပါ |
| `step_2` | Turn sharp left onto {name} | {name} ပေါ်သို့ ဘယ်ဘက် ထောင့်ချိုးကွေ့ပါ |
| `step_3` | Turn sharp right onto {name} | {name} ပေါ်သို့ ညာဘက် ထောင့်ချိုးကွေ့ပါ |
| `step_4` | Bear left onto {name} | {name} ပေါ်သို့ ဘယ်ဘက် အသာကွေ့ပါ |
| `step_5` | Bear right onto {name} | {name} ပေါ်သို့ ညာဘက် အသာကွေ့ပါ |
| `step_6` | Continue straight on {name} | {name} အတိုင်း တည့်တည့် ဆက်သွားပါ |
| `step_7` | Enter the roundabout | အဝိုင်းပတ်ထဲ ဝင်ပါ |
| `step_8` | Exit the roundabout onto {name} | အဝိုင်းပတ်မှ {name} ပေါ်သို့ ထွက်ပါ |
| `step_9` | Make a U-turn on {name} | {name} ပေါ်တွင် ဂငယ်ကွေ့ ပြန်လှည့်ပါ |
| `step_10` | Arrive at {name} | {name} သို့ ရောက်ပါပြီ |
| `step_11` | Head off on {name} | {name} အတိုင်း စတင်သွားပါ |
| `step_12` | Keep left onto {name} | {name} ပေါ်သို့ ဘယ်ဘက်ကပ် သွားပါ |
| `step_13` | Keep right onto {name} | {name} ပေါ်သို့ ညာဘက်ကပ် သွားပါ |
| `dir_n` | north | မြောက် |
| `dir_ne` | north-east | အရှေ့မြောက် |
| `dir_e` | east | အရှေ့ |
| `dir_se` | south-east | အရှေ့တောင် |
| `dir_s` | south | တောင် |
| `dir_sw` | south-west | အနောက်တောင် |
| `dir_w` | west | အနောက် |
| `dir_nw` | north-west | အနောက်မြောက် |
| `route_gps_error` | Couldn't get your location. Check location permission. | သင့်တည်နေရာကို မရယူနိုင်ပါ။ တည်နေရာ ခွင့်ပြုချက်ကို စစ်ဆေးပါ။ |
| `prep_title` | Prepare | ပြင်ဆင်ရန် |
| `prep_intro` | Get ready before it happens. Guides for each hazard, a go-bag list and the numbers to call. | မဖြစ်မီ ကြိုတင်ပြင်ဆင်ပါ။ အန္တရာယ်တစ်ခုချင်းစီအတွက် လမ်းညွှန်များ၊ အရေးပေါ်အိတ် စာရင်းနှင့် ခေါ်ရမည့် ဖုန်းနံပါတ်များ။ |
| `prep_guides` | Hazard guides | အန္တရာယ် လမ်းညွှန်များ |
| `prep_bag` | Go-bag checklist | အရေးပေါ်အိတ် စစ်ဆေးစာရင်း |
| `prep_bag_count` | {done} of {total} ready | {total} ခုတွင် {done} ခု အသင့် |
| `prep_bag_reset` | Reset | ပြန်စရန် |
| `prep_bag_note` | Saved on this device only. | ဤစက်ပေါ်တွင်သာ သိမ်းဆည်းထားသည်။ |
| `prep_kit_label` | Emergency | အရေးပေါ် |
| `prep_kit_basics` | Basics only | အခြေခံသာ |
| `prep_kit_auto` | Showing extras for {hazard}, active near you now. | ယခု သင့်အနီးတွင် ဖြစ်ပွားနေသော {hazard} အတွက် ထပ်ဆောင်းပစ္စည်းများကို ပြသနေသည်။ |
| `prep_numbers` | Emergency numbers | အရေးပေါ် ဖုန်းနံပါတ်များ |
| `prep_before` | Before | မဖြစ်မီ |
| `prep_during` | During | ဖြစ်နေစဉ် |
| `prep_after` | After | ဖြစ်ပြီးနောက် |
| `prep_back` | All guides | လမ်းညွှန် အားလုံး |
| `prep_call` | Call {tel}, {name} | {tel} ကို ဖုန်းခေါ်ရန်၊ {name} |
| `more_title` | More | နောက်ထပ် |
| `more_report` | Report an incident | ဖြစ်စဉ် သတင်းပို့ရန် |
| `more_language` | Language | ဘာသာစကား |
| `more_about` | About and data sources | အကြောင်းနှင့် ဒေတာရင်းမြစ်များ |
| `more_demo` | Demo tour | Demo လမ်းညွှန် |
| `more_staff` | Staff sign-in | ဝန်ထမ်း ဝင်ရောက်ရန် |
| `more_admin` | Admin | စီမံခန့်ခွဲသူ |
| `more_volunteer` | Volunteer | စေတနာ့ဝန်ထမ်း |
| `more_ask` | Ask DEMS | DEMS ကို မေးရန် |
| `coming_soon` | Coming soon | မကြာမီ |
| `about_levels_title` | How levels are set | အဆင့်များကို သတ်မှတ်ပုံ |
| `about_levels_body` | Each hazard near you gets Safe, Watch or Warning from public thresholds. The worst live hazard sets your level. If no source answers, the level is Unknown, never Safe. | သင့်အနီးရှိ အန္တရာယ်တစ်ခုစီသည် အများပြည်သူ သတ်မှတ်ချက်များအရ ဘေးကင်း၊ စောင့်ကြည့် သို့မဟုတ် သတိပေး အဆင့် ရရှိသည်။ ဖြစ်ပွားနေသော အဆိုးဆုံး အန္တရာယ်က သင့်အဆင့်ကို သတ်မှတ်သည်။ မည်သည့် ရင်းမြစ်ကမျှ မတုံ့ပြန်လျှင် အဆင့်သည် မသိရ ဖြစ်ပြီး ဘယ်တော့မှ ဘေးကင်း မဖြစ်ပါ။ |
| `about_row_pm25` | PM2.5: Watch above {w} µg/m³, Warning above {x} (Thai PCD) | PM2.5- {w} µg/m³ အထက် စောင့်ကြည့်၊ {x} အထက် သတိပေး (Thai PCD) |
| `about_row_heat` | Heat: Watch from {w}°C feels-like, Warning from {x}°C | အပူ- ခံစားရသော အပူချိန် {w}°C မှ စောင့်ကြည့်၊ {x}°C မှ သတိပေး |
| `about_row_rain` | Rain today: Watch from {w} mm, Warning from {x} mm (TMD) | ယနေ့ မိုးရေ- {w} မီလီမီတာမှ စောင့်ကြည့်၊ {x} မီလီမီတာမှ သတိပေး (TMD) |
| `about_row_quake` | Earthquake within {km} km in 24 h: Watch from M{w}, Warning from M{x} | 24 နာရီအတွင်း {km} ကီလိုမီတာ အတွင်း ငလျင်- M{w} မှ စောင့်ကြည့်၊ M{x} မှ သတိပေး |
| `about_row_gdacs` | GDACS events within {km} km (cyclones {ckm} km): orange = Watch, red = Warning | {km} ကီလိုမီတာ အတွင်း GDACS ဖြစ်ရပ်များ (ဆိုင်ကလုန်း {ckm} ကီလိုမီတာ)- လိမ္မော်ရောင် = စောင့်ကြည့်၊ အနီရောင် = သတိပေး |
| `about_row_river` | River model rising: Watch only (it is a forecast, not a measurement) | မြစ်မော်ဒယ် မြင့်တက်ခြင်း- စောင့်ကြည့်သာ (ခန့်မှန်းချက် ဖြစ်ပြီး တိုင်းတာချက် မဟုတ်ပါ) |
| `about_row_sample` | Sample disasters: listed with a Sample tag, never counted | နမူနာ ဘေးအန္တရာယ်များ- နမူနာ တံဆိပ်ဖြင့် ပြသပြီး ဘယ်တော့မှ ထည့်မတွက်ပါ |
| `about_limits_title` | Limits | ကန့်သတ်ချက်များ |
| `about_limits_body` | This is a student project, not an official warning service. Data can be late or wrong. Routes avoid only hazard zones we know about and cannot see road closures. Always follow {officials}, and call {sos} in an emergency. | ဤသည်မှာ ကျောင်းသား ပရောဂျက်တစ်ခု ဖြစ်ပြီး တရားဝင် သတိပေးဝန်ဆောင်မှု မဟုတ်ပါ။ ဒေတာ နောက်ကျနိုင် သို့မဟုတ် မှားနိုင်သည်။ လမ်းကြောင်းများသည် ကျွန်ုပ်တို့ သိသော အန္တရာယ်ဇုန်များကိုသာ ရှောင်ပြီး လမ်းပိတ်ခြင်းများကို မမြင်နိုင်ပါ။ {officials} ကို အမြဲ လိုက်နာပြီး အရေးပေါ်အခြေအနေတွင် {sos} ကို ဖုန်းခေါ်ပါ။ |
| `about_real_routes` | Walking, driving and cycling routes: openrouteservice by HeiGIT, on OpenStreetMap data | လမ်းလျှောက်၊ ကားမောင်းနှင့် စက်ဘီးစီး လမ်းကြောင်းများ- HeiGIT ၏ openrouteservice၊ OpenStreetMap ဒေတာပေါ်တွင် |
| `route_attribution` | Routes: © openrouteservice.org by HeiGIT · Map data © OpenStreetMap contributors | လမ်းကြောင်းများ- © openrouteservice.org by HeiGIT · မြေပုံဒေတာ © OpenStreetMap ပါဝင်ကူညီသူများ |
| `error_title` | Page not found | စာမျက်နှာ ရှာမတွေ့ပါ |
| `error_home` | Go to Now | ယခု သို့ သွားရန် |
| `login_unavailable` | Sign-in is unavailable right now. Please try again shortly. | ယခု ဝင်ရောက်၍ မရနိုင်ပါ။ ခဏနေမှ ထပ်ကြိုးစားပါ။ |
| `demo_title` | Disaster alerts, explained | ဘေးအန္တရာယ် သတိပေးချက်များ၊ ရှင်းလင်းချက် |
| `demo_video_label` | DEMS demo video (Thailand version), 35 seconds, captions on screen | DEMS demo ဗီဒီယို (ထိုင်းနိုင်ငံ ဗားရှင်း)၊ 35 စက္ကန့်၊ မျက်နှာပြင်ပေါ်တွင် စာတန်းပါ |
| `demo_sound` | Sound | အသံ |
| `demo_lead_1` | DEMS checks public weather, air quality, river, earthquake and global disaster data near you. | DEMS သည် သင့်အနီးရှိ အများပြည်သူ မိုးလေဝသ၊ လေထုအရည်အသွေး၊ မြစ်၊ ငလျင်နှင့် ကမ္ဘာ့ဘေးအန္တရာယ် ဒေတာများကို စစ်ဆေးသည်။ |
| `demo_lead_2` | It turns all of that into one level: Safe, Watch or Warning. | ၎င်းတို့အားလုံးကို အဆင့်တစ်ခုတည်းအဖြစ် ပြောင်းပေးသည်- ဘေးကင်း၊ စောင့်ကြည့် သို့မဟုတ် သတိပေး။ |
| `demo_lead_3` | It shows you the nearest shelter and a way there that steers around danger. | အနီးဆုံး ခိုလှုံရာနေရာနှင့် အန္တရာယ်ကို ရှောင်သော လမ်းကြောင်းကို ပြသပေးသည်။ |
| `demo_honest` | A student project. Levels are estimates from public data, not official warnings. Shelters are sample data. The video is an illustration; the live app shows real conditions. | ကျောင်းသား ပရောဂျက်တစ်ခု ဖြစ်သည်။ အဆင့်များသည် အများပြည်သူ ဒေတာမှ ခန့်မှန်းချက်များသာ ဖြစ်ပြီး တရားဝင် သတိပေးချက်များ မဟုတ်ပါ။ ခိုလှုံရာနေရာများသည် နမူနာဒေတာ ဖြစ်သည်။ ဗီဒီယိုသည် ဥပမာပြချက်သာ ဖြစ်ပြီး တိုက်ရိုက်အက်ပ်က အမှန်တကယ် အခြေအနေကို ပြသည်။ |
| `demo_try` | Try the live app | တိုက်ရိုက်အက်ပ်ကို စမ်းကြည့်ရန် |
| `demo_roles_title` | Who it's for | မည်သူများအတွက်လဲ |
| `demo_live` | Live now | ယခု အသုံးပြုနိုင် |
| `demo_phase2` | Phase 2 | အဆင့် 2 |
| `demo_role_citizen` | Citizens | ပြည်သူများ |
| `demo_role_citizen_body` | See your level, the hazard map, shelters and a safe route. Pack a go-bag. Report an incident. | သင့်အဆင့်၊ အန္တရာယ်မြေပုံ၊ ခိုလှုံရာနေရာများနှင့် ဘေးကင်းသော လမ်းကြောင်းကို ကြည့်ပါ။ အရေးပေါ်အိတ် ပြင်ဆင်ပါ။ ဖြစ်စဉ် သတင်းပို့ပါ။ |
| `demo_role_volunteer` | Volunteers | စေတနာ့ဝန်ထမ်းများ |
| `demo_role_volunteer_body` | Check and update incident reports from the field. | ကွင်းဆင်းနေရာမှ ဖြစ်စဉ် သတင်းပို့ချက်များကို စစ်ဆေးပြီး အပ်ဒိတ်လုပ်ပါ။ |
| `demo_role_admin` | Admins | စီမံခန့်ခွဲသူများ |
| `demo_role_admin_body` | Manage shelters and reports, and send alerts. | ခိုလှုံရာနေရာများနှင့် သတင်းပို့ချက်များကို စီမံပြီး သတိပေးချက်များ ပေးပို့ပါ။ |
| `demo_hood_title` | Under the hood | နောက်ကွယ်မှ နည်းပညာ |
| `demo_hood_intro` | For teachers and the curious: how DEMS is built. | ဆရာ/ဆရာမများနှင့် စိတ်ဝင်စားသူများအတွက်- DEMS ကို တည်ဆောက်ပုံ။ |
| `demo_hood_arch` | Architecture | ဗိသုကာပုံစံ |
| `demo_hood_arch_body` | One SvelteKit app does both the screens and the server API, written in TypeScript. It runs on Vercel in Tokyo, close to Thailand. Data lives in Supabase, a hosted Postgres database, also in Tokyo. | SvelteKit အက်ပ်တစ်ခုတည်းက မျက်နှာပြင်များနှင့် ဆာဗာ API နှစ်ခုလုံးကို လုပ်ဆောင်ပြီး TypeScript ဖြင့် ရေးထားသည်။ ထိုင်းနိုင်ငံနှင့် နီးသော Tokyo ရှိ Vercel ပေါ်တွင် လည်ပတ်သည်။ ဒေတာများကို Tokyo ရှိ hosted Postgres ဒေတာဘေ့စ် ဖြစ်သော Supabase တွင် သိမ်းထားသည်။ |
| `demo_arch_1` | Your phone or browser | သင့်ဖုန်း သို့မဟုတ် ဘရောက်ဆာ |
| `demo_arch_2` | SvelteKit on Vercel | Vercel ပေါ်ရှိ SvelteKit |
| `demo_arch_3` | Supabase Postgres | Supabase Postgres ဒေတာဘေ့စ် |
| `demo_hood_flow` | How data flows | ဒေတာ စီးဆင်းပုံ |
| `demo_hood_flow_body` | DEMS asks public sources for conditions near you, compares each value with published thresholds and gives every hazard a level. The worst live hazard sets your level. If no source answers, the level is Unknown, never Safe, and data older than 3 hours turns Unknown too. In Sweden, SMHI's official warnings set the weather level. | DEMS သည် သင့်အနီးရှိ အခြေအနေများကို အများပြည်သူ ရင်းမြစ်များထံ မေးမြန်းပြီး တန်ဖိုးတစ်ခုစီကို ထုတ်ပြန်ထားသော သတ်မှတ်ချက်များနှင့် နှိုင်းယှဉ်ကာ အန္တရာယ်တိုင်းကို အဆင့်တစ်ခု ပေးသည်။ ဖြစ်ပွားနေသော အဆိုးဆုံး အန္တရာယ်က သင့်အဆင့်ကို သတ်မှတ်သည်။ မည်သည့် ရင်းမြစ်ကမျှ မတုံ့ပြန်လျှင် အဆင့်သည် မသိရ ဖြစ်ပြီး ဘယ်တော့မှ ဘေးကင်း မဖြစ်ပါ။ 3 နာရီထက် ပိုဟောင်းသော ဒေတာလည်း မသိရ ဖြစ်သွားသည်။ ဆွီဒင်တွင် SMHI ၏ တရားဝင် သတိပေးချက်များက မိုးလေဝသ အဆင့်ကို သတ်မှတ်သည်။ |
| `demo_flow_1` | Public sources | အများပြည်သူ ရင်းမြစ်များ |
| `demo_flow_2` | Threshold rules | သတ်မှတ်ချက် စည်းမျဉ်းများ |
| `demo_flow_3` | One level | အဆင့်တစ်ခု |
| `demo_flow_4` | Your screen | သင့်မျက်နှာပြင် |
| `demo_hood_db` | Database and security | ဒေတာဘေ့စ်နှင့် လုံခြုံရေး |
| `demo_hood_db_body` | Row-level security in Postgres controls who can read or change each table. Staff sign in with a role, volunteer or admin. Reports and route requests are rate-limited per connection. Secret keys stay on the server, and every database call gives up after 8 seconds with a clear message instead of hanging. | Postgres ရှိ Row-level security က ဇယားတစ်ခုစီကို မည်သူ ဖတ်နိုင်၊ ပြင်နိုင်သည်ကို ထိန်းချုပ်သည်။ ဝန်ထမ်းများသည် စေတနာ့ဝန်ထမ်း သို့မဟုတ် စီမံခန့်ခွဲသူ အခန်းကဏ္ဍဖြင့် ဝင်ရောက်သည်။ သတင်းပို့ချက်များနှင့် လမ်းကြောင်းတောင်းဆိုမှုများကို ချိတ်ဆက်မှုတစ်ခုစီအလိုက် အရေအတွက် ကန့်သတ်ထားသည်။ လျှို့ဝှက်သော့များကို ဆာဗာပေါ်တွင်သာ ထားပြီး ဒေတာဘေ့စ်ခေါ်ဆိုမှုတိုင်းသည် ရပ်တန့်မနေဘဲ 8 စက္ကန့်အကြာတွင် ရှင်းလင်းသော မက်ဆေ့ချ်ဖြင့် ရပ်သွားသည်။ |
| `demo_hood_tests` | Testing | စမ်းသပ်ခြင်း |
| `demo_hood_tests_body` | Over 100 unit tests (Vitest) check the level rules, routing, go-bag lists and translations. Over 70 browser tests (Playwright) tap through every screen on a simulated phone with all outside services mocked, and run automatic accessibility checks (axe) against WCAG AA. | Unit test 100 ကျော် (Vitest) က အဆင့်စည်းမျဉ်းများ၊ လမ်းကြောင်းရှာခြင်း၊ အရေးပေါ်အိတ်စာရင်းများနှင့် ဘာသာပြန်များကို စစ်ဆေးသည်။ Browser test 70 ကျော် (Playwright) က အပြင်ဝန်ဆောင်မှု အားလုံးကို အတုလုပ်ထားသော ဖုန်းအတုပေါ်တွင် မျက်နှာပြင်တိုင်းကို နှိပ်စမ်းပြီး WCAG AA နှင့် အညီ အလိုအလျောက် အသုံးပြုနိုင်မှု စစ်ဆေးချက်များ (axe) ကို လုပ်ဆောင်သည်။ |
| `demo_hood_data` | Real or sample data | အမှန် သို့မဟုတ် နမူနာ ဒေတာ |
| `demo_hood_data_body` | Real: weather, air quality and river forecasts (Open-Meteo), earthquakes (USGS), global disaster alerts (GDACS), the map (OpenStreetMap) and routes (openrouteservice). Sample: shelters, past disasters and evacuation routes in our own database. Sample records are labelled and never change your level. | အမှန်- မိုးလေဝသ၊ လေထုအရည်အသွေးနှင့် မြစ်ခန့်မှန်းချက်များ (Open-Meteo)၊ ငလျင်များ (USGS)၊ ကမ္ဘာ့ဘေးအန္တရာယ် သတိပေးချက်များ (GDACS)၊ မြေပုံ (OpenStreetMap) နှင့် လမ်းကြောင်းများ (openrouteservice)။ နမူနာ- ကျွန်ုပ်တို့၏ ကိုယ်ပိုင် ဒေတာဘေ့စ်ရှိ ခိုလှုံရာနေရာများ၊ ယခင် ဘေးအန္တရာယ်များနှင့် ဘေးလွတ်ရာ လမ်းကြောင်းများ။ နမူနာမှတ်တမ်းများကို တံဆိပ်ကပ်ထားပြီး သင့်အဆင့်ကို ဘယ်တော့မှ မပြောင်းလဲစေပါ။ |
| `demo_hood_history` | History | သမိုင်းကြောင်း |
| `demo_hood_history_body` | DEMS started as an Express server with a MySQL database and a separate front end. It was rebuilt as one SvelteKit app on Supabase, so the screens and the API share one codebase, the database enforces its own access rules, and hosting is free and close to Thailand. The citizen screens were then redesigned for clarity, with a dark, high-contrast look. | DEMS သည် MySQL ဒေတာဘေ့စ်ပါသော Express ဆာဗာနှင့် သီးခြား front end အဖြစ် စတင်ခဲ့သည်။ ၎င်းကို Supabase ပေါ်ရှိ SvelteKit အက်ပ်တစ်ခုတည်းအဖြစ် ပြန်လည်တည်ဆောက်ခဲ့သဖြင့် မျက်နှာပြင်များနှင့် API သည် codebase တစ်ခုတည်းကို မျှဝေသုံးစွဲပြီး ဒေတာဘေ့စ်က ၎င်း၏ ဝင်ရောက်ခွင့် စည်းမျဉ်းများကို ကိုယ်တိုင် ထိန်းချုပ်ကာ hosting သည် အခမဲ့ဖြစ်ပြီး ထိုင်းနိုင်ငံနှင့် နီးသည်။ ထို့နောက် ပြည်သူသုံး မျက်နှာပြင်များကို ရှင်းလင်းစေရန် အမှောင်ရောင်၊ အလင်းအမှောင် ကွာခြားမှု မြင့်သော ပုံစံဖြင့် ပြန်လည် ဒီဇိုင်းဆွဲခဲ့သည်။ |
| `demo_thresholds` | Thresholds | သတ်မှတ်ချက်များ |
| `demo_chapters` | Chapters | အခန်းများ |
| `demo_ch_map` | Map | မြေပုံ |
| `demo_ch_level` | Your level | သင့်အဆင့် |
| `demo_ch_route` | Safe route | ဘေးကင်းသော လမ်းကြောင်း |
| `demo_ch_bag` | Go-bag | အရေးပေါ်အိတ် |
| `demo_ch_how` | How it works | အလုပ်လုပ်ပုံ |
| `about_demo_link` | Watch the demo tour | Demo လမ်းညွှန်ကို ကြည့်ရန် |
| `map_scope` | The map shows the whole region. Your level only counts hazards near you. | မြေပုံသည် ဒေသတစ်ခုလုံးကို ပြသည်။ သင့်အဆင့်တွင် သင့်အနီးရှိ အန္တရာယ်များကိုသာ ထည့်တွက်သည်။ |
| `num_1155` | Tourist police | ခရီးသွား ရဲ |
| `num_1182` | Weather (TMD) | မိုးလေဝသ (TMD) |
| `num_mm_199` | Police | ရဲ |
| `num_mm_192` | Ambulance | လူနာတင်ယာဉ် |
| `num_mm_191` | Fire | မီးသတ် |
| `num_se_112` | Emergency (police, ambulance, fire) | အရေးပေါ် (ရဲ၊ လူနာတင်ယာဉ်၊ မီးသတ်) |
| `num_se_1177` | Health advice | ကျန်းမာရေး အကြံဉာဏ် |
| `num_se_11414` | Police, non-emergency | ရဲ၊ အရေးပေါ် မဟုတ်သော ကိစ္စ |
| `num_se_11313` | Information in a major incident | ကြီးမားသော ဖြစ်ရပ်အတွင်း သတင်းအချက်အလက် |
| `haz_cold` | Extreme cold | အအေးလွန်ကဲခြင်း |
| `country_label` | Country | နိုင်ငံ |
| `country_TH` | Thailand | ထိုင်း |
| `country_MM` | Myanmar | မြန်မာ |
| `country_SE` | Sweden | ဆွီဒင် |
| `country_banner` | You're in {country}. Switch? | သင်သည် {country} တွင် ရှိနေသည်။ ပြောင်းမလား။ |
| `country_switch` | Switch | ပြောင်းရန် |
| `country_not_now` | Not now | ယခု မဟုတ် |
| `shelters_th_note` | Example shelters: Thailand has no public shelter list. In a real emergency, follow DDPM and local announcements. | ဥပမာ ခိုလှုံရာနေရာများ- ထိုင်းနိုင်ငံတွင် အများပြည်သူ ခိုလှုံရာနေရာ စာရင်း မရှိပါ။ တကယ့် အရေးပေါ်အခြေအနေတွင် DDPM နှင့် ဒေသဆိုင်ရာ ကြေညာချက်များကို လိုက်နာပါ။ |
| `shelters_dev_title` | Shelters: in development | ခိုလှုံရာနေရာများ- ဖော်ဆောင်ဆဲ |
| `shelters_dev_body` | Myanmar has no public shelter list we can use yet. In an emergency, follow official and local announcements. | မြန်မာနိုင်ငံတွင် ကျွန်ုပ်တို့ အသုံးပြုနိုင်သော အများပြည်သူ ခိုလှုံရာနေရာ စာရင်း မရှိသေးပါ။ အရေးပေါ်အခြေအနေတွင် တရားဝင်နှင့် ဒေသဆိုင်ရာ ကြေညာချက်များကို လိုက်နာပါ။ |
| `shelters_se_title` | Civil-defence shelters (skyddsrum) | အရပ်ဘက်ကာကွယ်ရေး ခိုလှုံရာများ (skyddsrum) |
| `shelters_se_body` | Sweden has about 64,000 civil-defence shelters for war and air raids. For storms or floods, follow SMHI and your municipality. MCF (formerly MSB) keeps the official map. | ဆွီဒင်တွင် စစ်ပွဲနှင့် လေကြောင်းတိုက်ခိုက်မှုများအတွက် အရပ်ဘက်ကာကွယ်ရေး ခိုလှုံရာ 64,000 ခန့် ရှိသည်။ မုန်တိုင်း သို့မဟုတ် ရေကြီးခြင်းအတွက် SMHI နှင့် သင့်မြို့နယ်အုပ်ချုပ်ရေးကို လိုက်နာပါ။ MCF (ယခင် MSB) က တရားဝင် မြေပုံကို ထိန်းသိမ်းထားသည်။ |
| `shelters_se_cta` | Open MCF's shelter map | MCF ၏ ခိုလှုံရာ မြေပုံကို ဖွင့်ရန် |
| `about_real_smhi` | Sweden: official weather warnings: SMHI | ဆွီဒင်- တရားဝင် မိုးလေဝသ သတိပေးချက်များ- SMHI |
| `about_row_pm25_who` | PM2.5 in Myanmar and Sweden: Watch above {w} µg/m³, Warning above {x} (WHO interim target) | မြန်မာနှင့် ဆွီဒင်တွင် PM2.5- {w} µg/m³ အထက် စောင့်ကြည့်၊ {x} အထက် သတိပေး (WHO ကြားကာလ ပစ်မှတ်) |
| `demo_video_th_note` | The video shows the Thailand version. | ဗီဒီယိုတွင် ထိုင်းနိုင်ငံ ဗားရှင်းကို ပြထားသည်။ |
| `map_all_hazards` | Hazards in {country} | {country}ရှိ အန္တရာယ်များ |
| `line_from` | from {time} | {time} မှ စတင် |
| `map_scope` | The map shows hazards in {country}. Your level only counts hazards near you. | မြေပုံသည် {country}ရှိ အန္တရာယ်များကို ပြသည်။ သင့်အဆင့်တွင် သင့်အနီးရှိ အန္တရာယ်များကိုသာ ထည့်တွက်သည်။ |

---

Reviewed by: ____  Date: ____
