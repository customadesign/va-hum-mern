import React, { useState, useRef, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import api from "../../services/api";
import {
  InformationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import {
  VideoCameraIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import ProfileCompletion from "../../components/ProfileCompletion";
import DISCQuestionnaire from "../../components/DISCTest/DISCQuestionnaire";

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  hero: Yup.string().required("Hero statement is required"),
  bio: Yup.string()
    .required("Bio is required")
    .min(100, "Bio must be at least 100 characters"),
  location: Yup.object({
    province: Yup.string().required("Province is required"),
    city: Yup.string().required("City is required"),
    barangay: Yup.string().required("Barangay is required"),
  }),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string(),
  website: Yup.string().url("Must be a valid URL"),
  meta: Yup.string(),
  instagram: Yup.string(),
  linkedin: Yup.string(),
  whatsapp: Yup.string(),
  twitter: Yup.string(),
  viber: Yup.string(),
  // DISC Assessment fields
  discPrimaryType: Yup.string().oneOf(['D', 'I', 'S', 'C', ''], 'Invalid DISC type'),
  discDominance: Yup.number().transform((value) => (isNaN(value) ? undefined : value)).min(0).max(100),
  discInfluence: Yup.number().transform((value) => (isNaN(value) ? undefined : value)).min(0).max(100),
  discSteadiness: Yup.number().transform((value) => (isNaN(value) ? undefined : value)).min(0).max(100),
  discConscientiousness: Yup.number().transform((value) => (isNaN(value) ? undefined : value)).min(0).max(100),
});

// Philippine location data with provinces, cities, and barangays
const philippineLocations = {
  "Metro Manila": {
    Manila: [
      "Binondo",
      "Ermita",
      "Intramuros",
      "Malate",
      "Paco",
      "Pandacan",
      "Port Area",
      "Quiapo",
      "Sampaloc",
      "San Andres",
      "San Miguel",
      "San Nicolas",
      "Santa Ana",
      "Santa Cruz",
      "Santa Mesa",
      "Tondo",
    ],
    "Quezon City": [
      "Alicia",
      "Bagong Pag-asa",
      "Bahay Toro",
      "Balingasa",
      "Bungad",
      "Central",
      "Commonwealth",
      "Culiat",
      "Diliman",
      "Holy Spirit",
      "Kamuning",
      "Kristong Hari",
      "Libis",
      "Malaking Bahay",
      "Mariana",
      "New Era",
      "North Fairview",
      "Novaliches Proper",
      "Old Balara",
      "Pasong Putik Proper",
      "Project 6",
      "Sacred Heart",
      "San Bartolome",
      "Tandang Sora",
      "White Plains",
    ],
    Makati: [
      "Bangkal",
      "Bel-Air",
      "Cembo",
      "Comembo",
      "Dasmariñas",
      "East Rembo",
      "Forbes Park",
      "Guadalupe Nuevo",
      "Guadalupe Viejo",
      "Kasilawan",
      "La Paz",
      "Magallanes",
      "Olympia",
      "Palanan",
      "Pembo",
      "Pinagkaisahan",
      "Pio del Pilar",
      "Poblacion",
      "Post Proper Northside",
      "Post Proper Southside",
      "Rizal",
      "San Antonio",
      "San Isidro",
      "San Lorenzo",
      "Santa Cruz",
      "Singkamas",
      "South Cembo",
      "Tejeros",
      "Urdaneta",
      "Valenzuela",
      "West Rembo",
    ],
    Taguig: [
      "Bagumbayan",
      "Bambang",
      "Calzada",
      "Central Bicutan",
      "Central Signal Village",
      "Fort Bonifacio",
      "Hagonoy",
      "Ibayo-Tipas",
      "Katuparan",
      "Ligid-Tipas",
      "Lower Bicutan",
      "Maharlika Village",
      "Napindan",
      "New Lower Bicutan",
      "North Daang Hari",
      "North Signal Village",
      "Palingon",
      "Pinagsama",
      "San Miguel",
      "Santa Ana",
      "South Daang Hari",
      "South Signal Village",
      "Tanyag",
      "Tuktukan",
      "Upper Bicutan",
      "Ususan",
      "Wawa",
      "Western Bicutan",
    ],
    Pasig: [
      "Bagong Ilog",
      "Bagong Katipunan",
      "Bambang",
      "Buting",
      "Caniogan",
      "Dela Paz",
      "Kalawaan",
      "Kapasigan",
      "Kapitolyo",
      "Malinao",
      "Manggahan",
      "Maybunga",
      "Oranbo",
      "Palatiw",
      "Pinagbuhatan",
      "Rosario",
      "Sagad",
      "San Antonio",
      "San Joaquin",
      "San Jose",
      "San Miguel",
      "San Nicolas",
      "Santa Cruz",
      "Santa Lucia",
      "Santa Rosa",
      "Santo Tomas",
      "Sumilang",
      "Ugong",
    ],
  },
  Cebu: {
    "Cebu City": [
      "Adlaon",
      "Agsungot",
      "Apas",
      "Bacayan",
      "Banilad",
      "Basak Pardo",
      "Basak San Nicolas",
      "Binaliw",
      "Bonbon",
      "Budla-an",
      "Buhisan",
      "Capitol Site",
      "Carreta",
      "Central",
      "Cogon Pardo",
      "Cogon Ramos",
      "Day-as",
      "Duljo Fatima",
      "Ermita",
      "Guadalupe",
      "Guba",
      "Hipodromo",
      "Inayawan",
      "Kalubihan",
      "Kamagayan",
      "Kamputhaw",
      "Kasambagan",
      "Kinasang-an Pardo",
      "Labangon",
      "Lahug",
      "Lorega San Miguel",
      "Luz",
      "Mabini",
      "Mabolo",
      "Malubog",
      "Mambaling",
      "Pahina Central",
      "Pahina San Nicolas",
      "Pardo",
      "Pari-an",
      "Paril",
      "Pasil",
      "Poblacion Pardo",
      "Pulangbato",
      "Pung-ol Sibugay",
      "Punta Princesa",
      "Quiot",
      "Sambag I",
      "Sambag II",
      "San Antonio",
      "San Jose",
      "San Nicolas Central",
      "San Roque",
      "Santa Cruz",
      "Santo Niño",
      "Sapangdaku",
      "Sawang Calero",
      "Sinsin",
      "Sirao",
      "Suba",
      "Sudlon I",
      "Sudlon II",
      "T. Padilla",
      "Tabunan",
      "Tagba-o",
      "Talamban",
      "Taptap",
      "Tejero",
      "Tinago",
      "Tisa",
      "To-ong",
      "Zapatera",
    ],
    "Mandaue City": [
      "Alang-alang",
      "Bakilid",
      "Banilad",
      "Basak",
      "Cabancalan",
      "Cambaro",
      "Canduman",
      "Casili",
      "Casuntingan",
      "Centro",
      "Cubacub",
      "Guizo",
      "Ibabao-Estancia",
      "Jagobiao",
      "Labogon",
      "Looc",
      "Maguikay",
      "Mantuyong",
      "Opao",
      "Pakna-an",
      "Pagsabungan",
      "Subangdaku",
      "Tabok",
      "Tawason",
      "Tingub",
      "Tipolo",
      "Umapad",
    ],
    "Lapu-Lapu City": [
      "Agus",
      "Babag",
      "Bankal",
      "Baring",
      "Basak",
      "Buaya",
      "Calawisan",
      "Canjulao",
      "Caw-oy",
      "Caubian",
      "Gun-ob",
      "Ibo",
      "Looc",
      "Mactan",
      "Maribago",
      "Marigondon",
      "Pajac",
      "Poblacion",
      "Pajo",
      "Punta Engaño",
      "Pusok",
      "Sabang",
      "Santa Rosa",
      "Subabasbas",
      "Talima",
      "Tingo",
      "Tungasan",
    ],
    Talisay: [
      "Biasong",
      "Bulacao",
      "Cadulawan",
      "Camp Lapu-Lapu",
      "Candulawan",
      "Cansojong",
      "Dumlog",
      "Jaclupan",
      "Lagtang",
      "Lawaan I",
      "Lawaan II",
      "Lawaan III",
      "Linao",
      "Maghaway",
      "Manipis",
      "Mohon",
      "Poblacion",
      "Pooc",
      "San Isidro",
      "San Roque",
      "Tabunok",
      "Tangke",
      "Tapul",
    ],
  },
  "Davao del Sur": {
    "Davao City": [
      "Agdao",
      "Angalan",
      "Bago Aplaya",
      "Bago Gallera",
      "Baguio",
      "Baliok",
      "Bangkas Heights",
      "Baracatan",
      "Barangay 1-A",
      "Barangay 2-A",
      "Barangay 3-A",
      "Barangay 4-A",
      "Barangay 5-A",
      "Barangay 6-A",
      "Barangay 7-A",
      "Barangay 8-A",
      "Barangay 9-A",
      "Barangay 10-A",
      "Benda",
      "Bucana",
      "Buda",
      "Buhangin",
      "Bunawan",
      "Calinan",
      "Callawa",
      "Catalunan Grande",
      "Catalunan Pequeño",
      "Cawayan",
      "Centro",
      "Communal",
      "Crossing Bayabas",
      "Dacudao",
      "Daliao",
      "Dominga",
      "Dumoy",
      "Eden",
      "Gumitan",
      "Ilang",
      "Inayangan",
      "Indangan",
      "Kilate",
      "Lacson",
      "Lamanan",
      "Lampianao",
      "Langub",
      "Leon Garcia",
      "Libby",
      "Los Amigos",
      "Lubogan",
      "Lumiad",
      "Ma-a",
      "Magsaysay",
      "Malabog",
      "Malagos",
      "Malamba",
      "Manambulan",
      "Mandug",
      "Manuel Guianga",
      "Mapula",
      "Marapangi",
      "Marilog",
      "Matina Aplaya",
      "Matina Crossing",
      "Matina Pangi",
      "Megkawayan",
      "Mintal",
      "Mudiang",
      "Mulig",
      "New Carmen",
      "New Valencia",
      "Obrero",
      "Pampanga",
      "Panacan",
      "Panalum",
      "Pandaitan",
      "Pangyan",
      "Paquibato",
      "Paradise Embac",
      "Riverside",
      "Salaysay",
      "Saloy",
      "San Antonio",
      "San Isidro",
      "Santo Tomas",
      "Sasa",
      "Sibulan",
      "Sirib",
      "Suawan",
      "Subasta",
      "Tacunan",
      "Tagakpan",
      "Tagluno",
      "Tagurano",
      "Talandang",
      "Talomo",
      "Tamayong",
      "Tambobong",
      "Tamugan",
      "Tapak",
      "Tapia",
      "Tibuloy",
      "Tibungco",
      "Tigatto",
      "Toril",
      "Tugbok",
      "Tula",
      "Tumaga",
      "Ubalde",
      "Ula",
      "Vicente Hizon Sr.",
      "Waan",
      "Wangan",
      "Wilfredo Aquino",
    ],
    "Digos City": [
      "Aplaya",
      "Balabag",
      "Binaton",
      "Colorado",
      "Cogon",
      "Dahican",
      "Dawis",
      "Dulangan",
      "Goma",
      "Igpit",
      "Kapatagan",
      "Kiagot",
      "Lungag",
      "Mahayag",
      "Palili",
      "Poblacion",
      "Ruparan",
      "San Agustin",
      "San Jose",
      "San Miguel",
      "Sandawa",
      "Sinawilan",
      "Soong",
      "Tiguman",
      "Tres de Mayo",
      "Zone I",
      "Zone II",
      "Zone III",
    ],
  },
  Laguna: {
    Calamba: [
      "Bagong Kalsada",
      "Banadero",
      "Banay-banay",
      "Barangay I",
      "Barangay II",
      "Barangay III",
      "Barangay IV",
      "Barangay V",
      "Barangay VI",
      "Barangay VII",
      "Batino",
      "Bubuyan",
      "Bucal",
      "Bunggo",
      "Burol",
      "Camaligan",
      "Canlubang",
      "Halang",
      "Hornalan",
      "Kay-Anlog",
      "La Mesa",
      "Laguerta",
      "Lawa",
      "Lecheria",
      "Lingga",
      "Looc",
      "Mabato",
      "Makiling",
      "Mapagong",
      "Masili",
      "Maunong",
      "Mayapa",
      "Milagrosa",
      "Paciano Rizal",
      "Palingon",
      "Palo-Alto",
      "Palayan",
      "Pansol",
      "Parian",
      "Prinza",
      "Punta",
      "Puting Lupa",
      "Real",
      "Saimsim",
      "Sampiruhan",
      "San Cristobal",
      "San Jose",
      "San Juan",
      "Sirang Lupa",
      "Sucol",
      "Turbina",
      "Ulango",
      "Uwisan",
    ],
    "San Pedro": [
      "Bagong Silang",
      "Calendola",
      "Chrysanthemum",
      "Cuyab",
      "Estrella",
      "G.S.I.S.",
      "Landayan",
      "Laram",
      "Magsaysay",
      "Maharlika",
      "Nueva",
      "Pacita I",
      "Pacita II",
      "Poblacion",
      "Riverside",
      "Rosario",
      "Sampaguita Village",
      "San Antonio",
      "San Roque",
      "San Vicente",
      "Santo Niño",
      "United Bayanihan",
      "United Better Living",
    ],
    Biñan: [
      "Biñan",
      "Bungahan",
      "Canlalay",
      "Casile",
      "Dela Paz",
      "Ganado",
      "Langkiwa",
      "Loma",
      "Malaban",
      "Malamig",
      "Mampalasan",
      "Platero",
      "Poblacion",
      "San Antonio",
      "San Francisco",
      "San Jose",
      "San Vicente",
      "Santa Rosa",
      "Santo Domingo",
      "Santo Niño",
      "Soro-soro",
      "Timbao",
      "Tubigan",
      "Zapote",
    ],
  },
  Pampanga: {
    "Angeles City": [
      "Agapito del Rosario",
      "Amsic",
      "Anunas",
      "Balibago",
      "Capaya",
      "Claro M. Recto",
      "Cuayan",
      "Cutcut",
      "Cutud",
      "Lourdes Norte",
      "Lourdes Sur",
      "Malabañas",
      "Margot",
      "Mining",
      "Ninoy Aquino",
      "Pampang",
      "Pulung Bulu",
      "Pulung Cacutud",
      "Pulung Maragul",
      "Salapungan",
      "San Jose",
      "San Nicolas",
      "Santa Teresita",
      "Santa Trinidad",
      "Santo Cristo",
      "Santo Domingo",
      "Sapangbato",
      "Tabun",
      "Virgen delos Remedios",
    ],
    "San Fernando": [
      "Alasas",
      "Baliti",
      "Bulaon",
      "Cabalantian",
      "Calulut",
      "Dela Paz Norte",
      "Dela Paz Sur",
      "Dolores",
      "Juliana",
      "Lara",
      "Lourdes",
      "Magliman",
      "Maimpis",
      "Malino",
      "Malpitic",
      "Panipuan",
      "Pulung Bulu",
      "Quebiawan",
      "Saguin",
      "San Agustin",
      "San Felipe",
      "San Isidro",
      "San Jose",
      "San Juan",
      "San Nicolas",
      "San Pedro",
      "Santa Lucia",
      "Santa Teresita",
      "Santo Niño",
      "Santo Rosario",
      "Sindalan",
      "Telabastagan",
    ],
    "Mabalacat City": [
      "Atlu-Bola",
      "Bical",
      "Bundagul",
      "Cacutud",
      "Calumpang",
      "Camachiles",
      "Dapdap",
      "Dau",
      "Dolores",
      "Duquit",
      "Lakandula",
      "Mabiga",
      "Magalang",
      "Marcos Village",
      "Matimbo",
      "Poblacion",
      "Pulung Maragul",
      "Rustia",
      "Sabang",
      "San Francisco",
      "San Joaquin",
      "San Roque",
      "Santa Ines",
      "Santo Rosario",
      "Sapang Bato",
      "Tabun",
    ],
  },
  Bulacan: {
    Malolos: [
      "Anilao",
      "Atlag",
      "Babatnin",
      "Bagna",
      "Balayong",
      "Balite",
      "Bangkal",
      "Barihan",
      "Bulihan",
      "Bungahan",
      "Caingin",
      "Calero",
      "Caliligawan",
      "Canalate",
      "Caniogan",
      "Capitol Village",
      "Dakila",
      "Guinhawa",
      "Liang",
      "Ligas",
      "Longos",
      "Look 1st",
      "Look 2nd",
      "Lugam",
      "Mambog",
      "Masile",
      "Mojon",
      "Namayan",
      "Niugan",
      "Pamarawan",
      "Panasahan",
      "Pinagbakahan",
      "San Agustin",
      "San Gabriel",
      "San Juan",
      "San Pablo",
      "San Vicente",
      "Santa Rosa",
      "Santiago",
      "Santisima Trinidad",
      "Santo Cristo",
      "Santo Niño",
      "Sumapang Bata",
      "Sumapang Matanda",
      "Taal",
      "Tikay",
    ],
    Meycauayan: [
      "Bancal",
      "Banga",
      "Bayugo",
      "Calvario",
      "Camalig",
      "Libtong",
      "Loma de Gato",
      "Longos",
      "Malhacan",
      "Pajo",
      "Pandayan",
      "Pantoc",
      "Poblacion",
      "Tugatog",
      "Ubihan",
      "Zamora",
    ],
    Marilao: [
      "Abangan Norte",
      "Abangan Sur",
      "Abitang",
      "Ibayo",
      "Lambakin",
      "Lias",
      "Loma de Gato",
      "Nagbalon",
      "Patubig",
      "Poblacion",
      "Prenza I",
      "Prenza II",
      "Santa Rosa I",
      "Santa Rosa II",
      "Saog",
      "Tabing Ilog",
    ],
    "San Jose del Monte": [
      "Assumption",
      "Bagong Buhay I",
      "Bagong Buhay II",
      "Bagong Buhay III",
      "Ciudad Real",
      "Dulong Bayan",
      "Fatima I",
      "Fatima II",
      "Fatima III",
      "Fatima IV",
      "Fatima V",
      "Francisco Homes-Guijo",
      "Francisco Homes-Mulawin",
      "Francisco Homes-Narra",
      "Francisco Homes-Yakal",
      "Gaya-gaya",
      "Graceville",
      "Kaypian",
      "Kaybanban",
      "Lawang Pare",
      "Maharlika",
      "Minuyan I",
      "Minuyan II",
      "Minuyan III",
      "Minuyan IV",
      "Minuyan V",
      "Muzon",
      "Paradise III",
      "Poblacion",
      "San Manuel",
      "San Martin I",
      "San Martin II",
      "San Martin III",
      "San Martin IV",
      "San Pedro",
      "San Rafael I",
      "San Rafael II",
      "San Rafael III",
      "San Rafael IV",
      "San Rafael V",
      "Santo Cristo",
      "Santo Niño I",
      "Santo Niño II",
      "Sapang Palay",
      "Tungkong Mangga",
    ],
  },
  Cavite: {
    Bacoor: [
      "Alima",
      "Aniban I",
      "Aniban II",
      "Aniban III",
      "Aniban IV",
      "Aniban V",
      "Banay-banay",
      "Bayanan",
      "Campo Santo",
      "Daang Bukid",
      "Digman",
      "Dulong Bayan",
      "Ginintu",
      "Habay I",
      "Habay II",
      "Kaingin",
      "Kaong",
      "Ligas I",
      "Ligas II",
      "Ligas III",
      "Mabolo I",
      "Mabolo II",
      "Mabolo III",
      "Maliksi I",
      "Maliksi II",
      "Maliksi III",
      "Molino I",
      "Molino II",
      "Molino III",
      "Molino IV",
      "Molino V",
      "Molino VI",
      "Molino VII",
      "Niog I",
      "Niog II",
      "Niog III",
      "Panapaan I",
      "Panapaan II",
      "Panapaan III",
      "Panapaan IV",
      "Panapaan V",
      "Panapaan VI",
      "Panapaan VII",
      "Panapaan VIII",
      "Queens Row Central",
      "Queens Row East",
      "Queens Row West",
      "Real I",
      "Real II",
      "Salinas I",
      "Salinas II",
      "San Nicolas I",
      "San Nicolas II",
      "San Nicolas III",
      "Sineguelasan",
      "Springville",
      "Tabing Dagat",
      "Talaba I",
      "Talaba II",
      "Talaba III",
      "Talaba IV",
      "Talaba V",
      "Talaba VI",
      "Talaba VII",
      "Villa San Miguel I",
      "Villa San Miguel II",
      "Zapote I",
      "Zapote II",
      "Zapote III",
      "Zapote IV",
      "Zapote V",
    ],
    Imus: [
      "Anabu I-A",
      "Anabu I-B",
      "Anabu I-C",
      "Anabu I-D",
      "Anabu I-E",
      "Anabu I-F",
      "Anabu I-G",
      "Anabu II-A",
      "Anabu II-B",
      "Anabu II-C",
      "Anabu II-D",
      "Anabu II-E",
      "Anabu II-F",
      "Bayan Luma I",
      "Bayan Luma II",
      "Bayan Luma III",
      "Bayan Luma IV",
      "Bayan Luma V",
      "Bayan Luma VI",
      "Bayan Luma VII",
      "Bayan Luma VIII",
      "Bayan Luma IX",
      "Bucandala I",
      "Bucandala II",
      "Bucandala III",
      "Bucandala IV",
      "Bucandala V",
      "Buhay na Tubig",
      "Carsadang Bago I",
      "Carsadang Bago II",
      "Magdalo",
      "Malagasang I-A",
      "Malagasang I-B",
      "Malagasang I-C",
      "Malagasang I-D",
      "Malagasang I-E",
      "Malagasang I-F",
      "Malagasang I-G",
      "Malagasang II-A",
      "Malagasang II-B",
      "Malagasang II-C",
      "Malagasang II-D",
      "Malagasang II-E",
      "Malagasang II-F",
      "Medicion I-A",
      "Medicion I-B",
      "Medicion I-C",
      "Medicion I-D",
      "Medicion II-A",
      "Medicion II-B",
      "Medicion II-C",
      "Medicion II-D",
      "Medicion II-E",
      "Medicion II-F",
      "Palico I",
      "Palico II",
      "Palico III",
      "Palico IV",
      "Panacan I",
      "Panacan II",
      "Panacan III",
      "Poblacion I-A",
      "Poblacion I-B",
      "Poblacion I-C",
      "Poblacion II-A",
      "Poblacion II-B",
      "Poblacion III-A",
      "Poblacion III-B",
      "Poblacion IV-A",
      "Poblacion IV-B",
      "Poblacion IV-C",
      "Poblacion IV-D",
      "Tanzang Luma I",
      "Tanzang Luma II",
      "Tanzang Luma III",
      "Tanzang Luma IV",
      "Tanzang Luma V",
      "Tanzang Luma VI",
      "Toclong I-A",
      "Toclong I-B",
      "Toclong I-C",
      "Toclong II-A",
      "Toclong II-B",
    ],
  },
  Batangas: {
    "Batangas City": [
      "Alangilan",
      "Balagtas",
      "Balete",
      "Banaba Center",
      "Banaba Ibaba",
      "Banaba Kanluran",
      "Banaba Silangan",
      "Bilogo",
      "Bolbok",
      "Bukal",
      "Calicanto",
      "Calo",
      "Catandala",
      "Concepcion",
      "Conde Itaas",
      "Conde Labac",
      "Cumba",
      "Dumantay",
      "Gulod Itaas",
      "Gulod Labac",
      "Haligue Kanluran",
      "Haligue Silangan",
      "Ilijan",
      "Kumintang Ibaba",
      "Kumintang Ilaya",
      "Libjo",
      "Liponpon",
      "Maapaz",
      "Mahabang Dahilig",
      "Mahabang Parang",
      "Mahacot Kanluran",
      "Mahacot Silangan",
      "Malalim",
      "Malibayo",
      "Malitam",
      "Maruclap",
      "Mohon",
      "Pallocan Kanluran",
      "Pallocan Silangan",
      "Pinamucan",
      "Pinamucan Ibaba",
      "Poblacion",
      "Sampaga",
      "San Agapito",
      "San Agustin Kanluran",
      "San Agustin Silangan",
      "San Andres",
      "San Antonio",
      "San Isidro",
      "San Jose Sico",
      "Santa Clara",
      "Santa Rita Kita",
      "Santa Rita Aplaya",
      "Santo Domingo",
      "Santo Niño",
      "Simlong",
      "Sirang Lupa",
      "Sorosoro Ilaya",
      "Sorosoro Karsada",
      "Tabangao",
      "Talahib Pandayan",
      "Talahib Payapa",
      "Talumpok Kanluran",
      "Talumpok Silangan",
      "Tinga Itaas",
      "Tinga Labac",
      "Tingga Itaas",
      "Wawa",
    ],
  },
  Rizal: {
    Antipolo: [
      "Bagong Nayon",
      "Beverly Hills",
      "Calawis",
      "Cupang",
      "Dalig",
      "dela Paz",
      "Inarawan",
      "Mambugan",
      "Mayamot",
      "Muntindilaw",
      "San Jose",
      "San Juan",
      "San Luis",
      "San Roque",
      "Santa Cruz",
      "Santo Niño",
      "Sta. Maria",
    ],
  },
  "Ilocos Norte": {
    "Laoag City": [
      "Barit-Pandan",
      "Bengcag",
      "Buttong",
      "Gabu Norte",
      "Gabu Sur",
      "Nangalisan",
      "Poblacion",
      "San Matias",
      "Santa Angela",
      "Suyo",
      "Vira",
      "Zanjera Norte",
    ],
  },
  Albay: {
    "Legazpi City": [
      "Arimbay",
      "Bagacay",
      "Banquerohan",
      "Bariis",
      "Bigaa",
      "Bitano",
      "Bogtong",
      "Bonot",
      "Buenavista",
      "Cabagan",
      "Cabagñan",
      "Cogon",
      "Cruzada",
      "Cutmog",
      "Dap-dap",
      "Dinagaan",
      "Dita",
      "Estanza",
      "Gogon",
      "Ilawod",
      "Kapantawan",
      "Kawit",
      "Lamba",
      "Legazpi Port",
      "Maoyod",
      "Padang",
      "Pawa",
      "Pigcale",
      "Poblacion",
      "Puro",
      "Rawis",
      "Sagpon",
      "San Joaquin",
      "San Rafael",
      "San Roque",
      "Tula-tula",
      "Victory Village Central",
      "Victory Village Norte",
      "Victory Village Sur",
      "Washington Drive",
    ],
  },
  Palawan: {
    "Puerto Princesa": [
      "Bagong Pag-asa",
      "Bagong Sikat",
      "Bagong Silang",
      "Bahile",
      "Barangay Bancao-bancao",
      "Barangay IV",
      "Barangay Maningning",
      "Barangay Maunlad",
      "Binduyan",
      "Buenavista",
      "Cabayugan",
      "Concepcion",
      "Inagawan",
      "Irawan",
      "Iwahig",
      "Kalipapa",
      "Kamuning",
      "Langogan",
      "Liwanag",
      "Lucbuan",
      "Luzviminda",
      "Magkakaibigan",
      "Makinabang",
      "Mandaragat",
      "Marufinas",
      "Masigla",
      "Maunlad",
      "Milagrosa",
      "Model",
      "Napsan",
      "New Pangkat",
      "Poblacion",
      "Salvacion",
      "San Jose",
      "San Manuel",
      "San Miguel",
      "San Pedro",
      "San Rafael",
      "Santa Cruz",
      "Santa Lourdes",
      "Santa Lucia",
      "Santa Monica",
      "Sicsican",
      "Simpocan",
      "Tagabinet",
      "Tagburos",
      "Tagumpay",
      "Tanabag",
      "Tanglaw",
      "Tiniguiban",
      "Tumarbong",
    ],
  },
};

const getProvinces = () => Object.keys(philippineLocations);
const getCitiesByProvince = (province) =>
  province ? Object.keys(philippineLocations[province] || {}) : [];
const getBarangaysByCity = (province, city) => {
  if (!province || !city) return [];
  return philippineLocations[province]?.[city] || [];
};

export default function VAProfile() {
  const queryClient = useQueryClient();
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [showDISCTest, setShowDISCTest] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // Cascading dropdown state for location
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [availableCities, setAvailableCities] = useState([]);
  const [availableBarangays, setAvailableBarangays] = useState([]);

  // Fetch current VA profile
  const { data: profile, isLoading } = useQuery("vaProfile", async () => {
    const response = await api.get("/vas/me");
    return response.data.data;
  });

  // Fetch specialties
  const { data: specialties = [] } = useQuery("specialties", async () => {
    const response = await api.get("/specialties");
    return response.data.data;
  });

  // Update profile mutation
  const updateProfileMutation = useMutation(
    async (data) => {
      const response = await api.put("/vas/me", data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("vaProfile");
        toast.success("Profile updated successfully");
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || "Failed to update profile");
      },
    }
  );

  // Determine placeholders vs stored defaults
  const { user } = require('../../contexts/AuthContext').useAuth();
  const emailUsername = user?.email ? user.email.split('@')[0] : '';
  const isDefaultBio = profile?.bio === 'Tell us about yourself...';
  const isDefaultName =
    profile?.name === 'New Professional' ||
    (emailUsername && profile?.name === emailUsername);

  const formik = useFormik({
    initialValues: {
      name: isDefaultName ? "" : (profile?.name || ""),
      hero: profile?.hero || "",
      bio: isDefaultBio ? "" : (profile?.bio || ""),
      location: {
        street: profile?.location?.street || "",
        province: profile?.location?.province || profile?.location?.state || "", // Backward compatibility
        city: profile?.location?.city || "",
        barangay: profile?.location?.barangay || "",
        postal_code: profile?.location?.postal_code || "",
        country: "Philippines",
        country_code: "PH",
      },
      email: profile?.email || "",
      phone: profile?.phone || "",
      website: profile?.website || "",
      meta: profile?.meta || "",
      instagram: profile?.instagram || "",
      linkedin: profile?.linkedin || "",
      whatsapp: profile?.whatsapp || "",
      twitter: profile?.twitter || "",
      viber: profile?.viber || "",
      schedulingLink: profile?.schedulingLink || "",
      preferredMinHourlyRate: profile?.preferredMinHourlyRate || "",
      preferredMaxHourlyRate: profile?.preferredMaxHourlyRate || "",
      specialtyIds: profile?.specialties?.map((s) => s._id) || [],
      searchStatus: profile?.searchStatus || "actively_looking",
      roleType: {
        part_time_contract: profile?.roleType?.part_time_contract || false,
        full_time_contract: profile?.roleType?.full_time_contract || false,
        full_time_employment: profile?.roleType?.full_time_employment || false,
      },
      roleLevel: {
        junior: profile?.roleLevel?.junior || false,
        mid: profile?.roleLevel?.mid || false,
        senior: profile?.roleLevel?.senior || false,
        principal: profile?.roleLevel?.principal || false,
        c_level: profile?.roleLevel?.c_level || false,
      },
      profileReminderNotifications:
        profile?.profileReminderNotifications ?? true,
      productAnnouncementNotifications:
        profile?.productAnnouncementNotifications ?? true,
      // DISC Assessment fields
      discPrimaryType: profile?.discAssessment?.primaryType || "",
      discDominance: profile?.discAssessment?.scores?.dominance || "",
      discInfluence: profile?.discAssessment?.scores?.influence || "",
      discSteadiness: profile?.discAssessment?.scores?.steadiness || "",
      discConscientiousness:
        profile?.discAssessment?.scores?.conscientiousness || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      console.log('Form submitted with values:', values);
      if (!updateProfileMutation.isLoading) {
        updateProfileMutation.mutate(values);
      } else {
        console.log('Mutation already in progress, skipping submission');
      }
    },
  });

  // Cascading dropdown handlers
  const handleProvinceChange = (e) => {
    const province = e.target.value;
    setSelectedProvince(province);
    setSelectedCity("");
    setAvailableCities(getCitiesByProvince(province));
    setAvailableBarangays([]);

    // Update formik values
    formik.setFieldValue("location.province", province);
    formik.setFieldValue("location.city", "");
    formik.setFieldValue("location.barangay", "");
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    setAvailableBarangays(getBarangaysByCity(selectedProvince, city));

    // Update formik values
    formik.setFieldValue("location.city", city);
    formik.setFieldValue("location.barangay", "");
  };

  // Initialize cascading dropdowns when profile loads
  React.useEffect(() => {
    if (profile?.location) {
      const province = profile.location.province || profile.location.state;
      const city = profile.location.city;

      if (province) {
        setSelectedProvince(province);
        setAvailableCities(getCitiesByProvince(province));

        if (city) {
          setSelectedCity(city);
          setAvailableBarangays(getBarangaysByCity(province, city));
        }
      }
    }
  }, [profile]);



  // Calculate profile completion percentage
  const profileCompletion = useMemo(() => {
    const values = formik.values;
    
    // Check if name is just the email prefix (default value)
    const isDefaultName = values.name === values.email?.split('@')[0];
    
    const requiredFields = [
      // Essential fields (high weight) - Must have for basic profile
      { 
        field: "name", 
        weight: 10, 
        check: () => values.name?.trim() && !isDefaultName && values.name.length > 2,
        label: "Full Name"
      },
      { 
        field: "hero", 
        weight: 10, 
        check: () => values.hero?.trim() && values.hero.length > 10,
        label: "Hero Statement"
      },
      { 
        field: "bio", 
        weight: 15, 
        check: () => values.bio?.trim() && values.bio.length >= 100,
        label: "Bio (100+ chars)"
      },
      {
        field: "location",
        weight: 10,
        check: () =>
          values.location?.city?.trim() &&
          values.location?.province?.trim() &&
          values.location?.barangay?.trim(),
        label: "Complete Location"
      },
      { 
        field: "email", 
        weight: 10, 
        check: () => values.email?.trim() && values.email.includes('@'),
        label: "Email Address"
      },
      {
        field: "specialties",
        weight: 15,
        check: () => values.specialtyIds?.length > 0,
        label: "Specialties"
      },
      
      // Professional details (medium weight)
      {
        field: "searchStatus",
        weight: 5,
        check: () => values.searchStatus && values.searchStatus !== "invisible",
        label: "Search Status"
      },
      {
        field: "roleType",
        weight: 5,
        check: () => Object.values(values.roleType || {}).some(Boolean),
        label: "Role Type"
      },
      {
        field: "roleLevel",
        weight: 5,
        check: () => Object.values(values.roleLevel || {}).some(Boolean),
        label: "Experience Level"
      },
      {
        field: "hourlyRate",
        weight: 10,
        check: () =>
          Number(values.preferredMinHourlyRate) > 0 && 
          Number(values.preferredMaxHourlyRate) > 0 &&
          Number(values.preferredMaxHourlyRate) >= Number(values.preferredMinHourlyRate),
        label: "Hourly Rate Range"
      },
      
      // Contact & Social (lower weight)
      { 
        field: "phone", 
        weight: 5, 
        check: () => values.phone?.trim() && values.phone.length >= 10,
        label: "Phone Number"
      },
      {
        field: "onlinePresence",
        weight: 5,
        check: () => 
          values.website?.trim() || 
          values.linkedin?.trim() || 
          values.twitter?.trim() || 
          values.instagram?.trim(),
        label: "Online Presence"
      },
    ];

    const totalWeight = requiredFields.reduce(
      (sum, field) => sum + field.weight,
      0
    );
    const completedWeight = requiredFields.reduce((sum, field) => {
      return sum + (field.check() ? field.weight : 0);
    }, 0);

    const percentage = Math.round((completedWeight / totalWeight) * 100);
    const missingFields = requiredFields.filter((field) => !field.check());

    return {
      percentage,
      missingFields,
      isComplete: percentage === 100,
    };
  }, [formik.values]);

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingCover(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", "cover");

    try {
      const response = await api.post("/vas/me/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update the profile with new cover image URL
      await api.put("/vas/me", { coverImage: response.data.url });
      queryClient.invalidateQueries("vaProfile");
      toast.success("Cover image updated successfully");
    } catch (error) {
      console.error("Cover upload error:", error);
      toast.error(
        error.response?.data?.error || "Failed to upload cover image"
      );
      setCoverPreview(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("type", "avatar");

    try {
      const response = await api.post("/vas/me/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update the profile with new avatar URL
      await api.put("/vas/me", { avatar: response.data.url });
      
      // Invalidate both VA profile and user profile queries to update all components
      queryClient.invalidateQueries("vaProfile");
      queryClient.invalidateQueries("userProfile");
      
      toast.success("Profile picture updated successfully");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(
        error.response?.data?.error || "Failed to upload profile picture"
      );
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDISCComplete = (scores) => {
    // Update formik values with the questionnaire results
    formik.setFieldValue("discPrimaryType", scores.primaryType);
    formik.setFieldValue("discDominance", scores.dominance);
    formik.setFieldValue("discInfluence", scores.influence);
    formik.setFieldValue("discSteadiness", scores.steadiness);
    formik.setFieldValue("discConscientiousness", scores.conscientiousness);
    
    // Hide the questionnaire
    setShowDISCTest(false);
    
    // Save the profile with the new DISC scores
    const values = formik.values;
    values.discPrimaryType = scores.primaryType;
    values.discDominance = scores.dominance;
    values.discInfluence = scores.influence;
    values.discSteadiness = scores.steadiness;
    values.discConscientiousness = scores.conscientiousness;
    
    if (!updateProfileMutation.isLoading) {
      updateProfileMutation.mutate(values);
    }
    
    toast.success("DISC assessment completed and saved!");
  };

  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file");
      return;
    }

        // Validate file size (max 1GB)
        if (file.size > 1024 * 1024 * 1024) {
          toast.error("Video file size must be less than 1GB");
          return;
        }

    setUploadingVideo(true);
    setVideoProgress(0);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await api.post("/vas/me/upload-video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setVideoProgress(percentCompleted);
        },
      });

      await api.put("/vas/me", { videoIntroduction: response.data.url });
      queryClient.invalidateQueries("vaProfile");
      toast.success("Video uploaded successfully");
    } catch (error) {
      console.error("Video upload error:", error);
      toast.error(error.response?.data?.error || "Failed to upload video");
    } finally {
      setUploadingVideo(false);
      setVideoProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Edit Profile - Linkage VA Hub</title>
      </Helmet>

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mx-4 lg:mx-0 mt-8 lg:mt-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold leading-tight text-gray-900">
                Edit Your VA Profile
              </h1>
            </div>
            {profile?._id && (
              <div className="mt-4 sm:mt-0">
                <Link
                  to={`/vas/${profile._id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <EyeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  View Public Profile
                </Link>
              </div>
            )}
          </div>

          {/* Profile Completion Progress - also available in footer */}
          <ProfileCompletion className="mx-4 lg:mx-0 mb-6" />

          {/* Profile Complete Celebration */}
          {profileCompletion.isComplete && (
            <div className="mx-4 lg:mx-0 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      🎉 Profile Complete!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        Excellent! Your profile is 100% complete. Businesses can
                        now find and connect with you more easily. Keep your
                        information updated to stay competitive.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-8">
            {/* Profile Section */}
            <section className="bg-white shadow px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    Profile
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    This information will be displayed publicly so be careful
                    what you share.
                  </p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Full Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={formik.values.name}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="Enter your full name"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.name && formik.errors.name
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-300 focus:ring-gray-500 focus:border-gray-500"
                          }`}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Your name will be displayed on your profile and in
                        search results.
                      </p>
                      {formik.touched.name && formik.errors.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {formik.errors.name}
                        </p>
                      )}
                    </div>

                    {/* Hero */}
                    <div>
                      <label
                        htmlFor="hero"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Hero Statement
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="hero"
                          id="hero"
                          value={formik.values.hero}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="e.g., Virtual Assistant specializing in e-commerce support"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.hero && formik.errors.hero
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-300 focus:ring-gray-500 focus:border-gray-500"
                          }`}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        A brief statement that describes what you do.
                      </p>
                      {formik.touched.hero && formik.errors.hero && (
                        <p className="mt-1 text-sm text-red-600">
                          {formik.errors.hero}
                        </p>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <div className="space-y-4">
                        {/* Street Address */}
                        <div>
                          <label
                            htmlFor="location.street"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Street Address
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="location.street"
                              id="location.street"
                              value={formik.values.location.street}
                              onChange={formik.handleChange}
                              placeholder="e.g. 123 Rizal Street, Barangay San Juan"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                            />
                          </div>
                        </div>

                        {/* Province */}
                        <div>
                          <label
                            htmlFor="location.province"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Province *
                          </label>
                          <div className="mt-1">
                            <select
                              name="location.province"
                              id="location.province"
                              value={formik.values.location.province}
                              onChange={handleProvinceChange}
                              onBlur={formik.handleBlur}
                              className={`block w-full rounded-md shadow-sm sm:text-sm ${
                                formik.touched.location?.province &&
                                formik.errors.location?.province
                                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                  : "border-gray-300 focus:ring-gray-500 focus:border-gray-500"
                              }`}
                            >
                              <option value="">Select Province</option>
                              {getProvinces().map((province) => (
                                <option key={province} value={province}>
                                  {province}
                                </option>
                              ))}
                            </select>
                          </div>
                          {formik.touched.location?.province &&
                            formik.errors.location?.province && (
                              <p className="mt-1 text-sm text-red-600">
                                {formik.errors.location.province}
                              </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* City */}
                          <div>
                            <label
                              htmlFor="location.city"
                              className="block text-sm font-medium text-gray-700"
                            >
                              City *
                            </label>
                            <div className="mt-1">
                              <select
                                name="location.city"
                                id="location.city"
                                value={formik.values.location.city}
                                onChange={handleCityChange}
                                onBlur={formik.handleBlur}
                                disabled={!selectedProvince}
                                className={`block w-full rounded-md shadow-sm sm:text-sm ${
                                  formik.touched.location?.city &&
                                  formik.errors.location?.city
                                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:ring-gray-500 focus:border-gray-500"
                                } ${
                                  !selectedProvince
                                    ? "bg-gray-50 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                <option value="">Select City</option>
                                {availableCities.map((city) => (
                                  <option key={city} value={city}>
                                    {city}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {formik.touched.location?.city &&
                              formik.errors.location?.city && (
                                <p className="mt-1 text-sm text-red-600">
                                  {formik.errors.location.city}
                                </p>
                              )}
                          </div>

                          {/* Barangay */}
                          <div>
                            <label
                              htmlFor="location.barangay"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Barangay *
                            </label>
                            <div className="mt-1">
                              <select
                                name="location.barangay"
                                id="location.barangay"
                                value={formik.values.location.barangay}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                disabled={!selectedCity}
                                className={`block w-full rounded-md shadow-sm sm:text-sm ${
                                  formik.touched.location?.barangay &&
                                  formik.errors.location?.barangay
                                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:ring-gray-500 focus:border-gray-500"
                                } ${
                                  !selectedCity
                                    ? "bg-gray-50 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                <option value="">Select Barangay</option>
                                {availableBarangays.map((barangay) => (
                                  <option key={barangay} value={barangay}>
                                    {barangay}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {formik.touched.location?.barangay &&
                              formik.errors.location?.barangay && (
                                <p className="mt-1 text-sm text-red-600">
                                  {formik.errors.location.barangay}
                                </p>
                              )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Postal Code */}
                          <div>
                            <label
                              htmlFor="location.postal_code"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Postal Code
                            </label>
                            <div className="mt-1">
                              <input
                                type="text"
                                name="location.postal_code"
                                id="location.postal_code"
                                value={formik.values.location.postal_code}
                                onChange={formik.handleChange}
                                placeholder="e.g. 1000"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 rounded-md">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              🇵🇭 All VAs on Linkage VA Hub are based in the
                              Philippines (GMT+8 timezone). This helps
                              businesses plan collaboration and meetings.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Avatar */}
                    <div>
                      <span className="block text-sm font-medium text-gray-700">
                        Profile Picture
                      </span>
                      <p className="mt-1 text-sm text-gray-500">
                        Upload a professional profile picture. Best dimensions: 400×400 pixels (square). PNG, JPG, GIF up to 5MB.
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <div 
                          className="relative group cursor-pointer"
                          onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
                        >
                          {/* Profile Image */}
                          {profile?.avatar || avatarPreview ? (
                            <div className="relative">
                              <img
                                className="h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-lg transition-transform group-hover:scale-105"
                                src={avatarPreview || profile?.avatar}
                                alt="Profile"
                              />
                              {/* Hover Overlay - Only shown when image exists */}
                              <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                                <CameraIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center ring-4 ring-white shadow-lg transition-transform group-hover:scale-105">
                                <span className="text-3xl font-semibold text-indigo-600">
                                  {formik.values.name?.[0]?.toUpperCase() || "V"}
                                </span>
                              </div>
                              {/* Camera Icon Overlay - Always shown when no image */}
                              <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 shadow-lg transform translate-x-1 -translate-y-1 group-hover:scale-110 transition-transform">
                                  <CameraIcon className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Upload Progress Overlay */}
                          {uploadingAvatar && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-full">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                <span className="text-xs text-white font-medium">Uploading...</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Upload Instructions */}
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {profile?.avatar ? "Update your photo" : "Add a photo"}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {profile?.avatar 
                              ? "Click on your photo to change it" 
                              : "Click the camera icon to upload"}
                          </p>
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            <ArrowUpTrayIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                            Choose File
                          </button>
                        </div>
                        
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Cover Image */}
                    <div>
                      <span className="block text-sm font-medium text-gray-700">
                        Cover Image
                      </span>
                      <p className="mt-1 text-sm text-gray-500">
                        Upload a professional banner image for your profile.
                        Best dimensions: 1200×400 pixels. PNG, JPG, GIF up to
                        10MB.
                      </p>
                      <div className="relative mt-2">
                        <div className="relative h-48 rounded-md overflow-hidden bg-gray-100">
                          <img
                            className="w-full h-full object-cover"
                            src={
                              coverPreview ||
                              profile?.coverImage ||
                              "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=300&fit=crop"
                            }
                            alt="Cover"
                          />
                          {uploadingCover && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            className="absolute right-4 bottom-4 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          >
                            Change
                          </button>
                        </div>
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCoverChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Contact Information
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your contact details for employers to reach you.
                  </p>
                </div>
                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email Address
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={formik.values.email}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="your.email@example.com"
                          className={`block w-full rounded-md shadow-sm sm:text-sm ${
                            formik.touched.email && formik.errors.email
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-300 focus:ring-gray-500 focus:border-gray-500"
                          }`}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Your professional email address for employers to contact
                        you.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Phone Number
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          +63
                        </span>
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          value={formik.values.phone}
                          onChange={formik.handleChange}
                          placeholder="9171234567"
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Your primary phone number for employers to contact you
                        directly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Video Introduction */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    Video Introduction
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    A short video introduction helps you stand out. Upload a 1-2
                    minute video telling employers about yourself.
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Videos up to 1GB are supported.
                  </p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    {profile?.videoIntroduction ? (
                      <div>
                        <div
                          className="relative bg-gray-100 rounded-lg overflow-hidden"
                          style={{ aspectRatio: "16/9" }}
                        >
                          <video
                            controls
                            className="w-full h-full object-cover"
                          >
                            <source
                              src={profile.videoIntroduction}
                              type="video/mp4"
                            />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                        <p className="mt-2 text-sm text-green-600 text-center">
                          ✓ Video uploaded successfully
                        </p>
                        <div className="text-center mt-4">
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          >
                            <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5" />
                            Replace Video
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 mb-4">
                          <VideoCameraIcon className="h-12 w-12 text-blue-600" />
                        </div>

                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <ArrowUpTrayIcon className="-ml-1 mr-3 h-6 w-6" />
                          Upload Video Introduction
                        </button>

                        <p className="mt-3 text-sm text-gray-500">
                          Upload a 1-2 minute video introducing yourself
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          MP4, MOV, WebM up to 1GB
                        </p>
                      </div>
                    )}

                    {uploadingVideo && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="animate-spin h-8 w-8 text-blue-600">
                              <svg
                                className="h-8 w-8"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-sm font-medium text-blue-800">
                              Uploading video...
                            </h3>
                            <div className="mt-2">
                              <div className="bg-white rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${videoProgress}%` }}
                                ></div>
                              </div>
                              <p className="mt-2 text-sm text-blue-600">
                                {videoProgress}% complete
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Bio */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    Bio
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Share some information about yourself. What you did before,
                    what you're doing now, and what you're looking for next.
                  </p>

                  <h4 className="font-medium uppercase tracking-wide text-gray-500 text-sm mt-4">
                    EXAMPLES
                  </h4>
                  <ul className="text-sm text-gray-500 list-disc list-inside">
                    <li className="mt-1">Where you're originally from</li>
                    <li className="mt-1">What you've accomplished</li>
                    <li className="mt-1">What you've learned</li>
                    <li className="mt-1">What you're passionate about</li>
                    <li className="mt-1">How you can help businesses</li>
                    <li className="mt-1">What makes you unique</li>
                  </ul>

                  <p className="mt-4 text-sm text-gray-500">
                    You can use Markdown for formatting.
                  </p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    <div>
                      <textarea
                        name="bio"
                        id="bio"
                        rows={20}
                        value={formik.values.bio}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`block w-full rounded-md shadow-sm sm:text-sm ${
                          formik.touched.bio && formik.errors.bio
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-gray-500 focus:border-gray-500"
                        }`}
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        {formik.values.bio.length} characters. Minimum 100
                        characters.
                      </p>
                      {formik.touched.bio && formik.errors.bio && (
                        <p className="mt-1 text-sm text-red-600">
                          {formik.errors.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Specialties */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div>
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    Specialties
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Pick the things you're good at, have experience with, or
                    want to learn.
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Missing a specialty?{" "}
                    <a
                      href="mailto:hello@linkage.ph?subject=New specialty suggestion"
                      className="text-gray-700 font-medium underline hover:text-gray-900"
                    >
                      Let us know
                    </a>
                    .
                  </p>

                  <h4 className="font-medium uppercase tracking-wide text-gray-500 text-sm mt-4">
                    NOTE
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    These affect the search results and are public, so be honest
                    about your skills.
                  </p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {specialties.map((specialty) => (
                        <div key={specialty._id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`specialty-${specialty._id}`}
                            value={specialty._id}
                            checked={formik.values.specialtyIds.includes(
                              specialty._id
                            )}
                            onChange={(e) => {
                              const { checked, value } = e.target;
                              if (checked) {
                                formik.setFieldValue("specialtyIds", [
                                  ...formik.values.specialtyIds,
                                  value,
                                ]);
                              } else {
                                formik.setFieldValue(
                                  "specialtyIds",
                                  formik.values.specialtyIds.filter(
                                    (id) => id !== value
                                  )
                                );
                              }
                            }}
                            className="h-4 w-4 border-gray-300 rounded text-gray-600 focus:ring-gray-500"
                          />
                          <label
                            htmlFor={`specialty-${specialty._id}`}
                            className="ml-3 text-sm text-gray-700"
                          >
                            {specialty.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* DISC Personality Assessment */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div>
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    DISC Personality Assessment
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Help businesses understand your personality type and working
                    style by completing a DISC assessment.
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Take the DISC assessment below (4-6 minutes) to automatically calculate and save your personality profile.
                  </p>
                  <h4 className="font-medium uppercase tracking-wide text-gray-500 text-sm mt-4">
                    ABOUT DISC
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    DISC measures four personality types: Dominance (D),
                    Influence (I), Steadiness (S), and Conscientiousness (C).
                  </p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    {/* DISC Assessment */}
                    {showDISCTest ? (
                      <DISCQuestionnaire
                        onComplete={handleDISCComplete}
                        initialScores={
                          formik.values.discPrimaryType
                            ? {
                                primaryType: formik.values.discPrimaryType,
                                dominance: formik.values.discDominance,
                                influence: formik.values.discInfluence,
                                steadiness: formik.values.discSteadiness,
                                conscientiousness: formik.values.discConscientiousness,
                              }
                            : null
                        }
                      />
                    ) : (
                      <div>
                        {formik.values.discPrimaryType ? (
                          <div className="bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <CheckCircleIcon
                                  className="h-5 w-5 text-green-400"
                                  aria-hidden="true"
                                />
                              </div>
                              <div className="ml-3 flex-1">
                                <h3 className="text-sm font-medium text-green-800">
                                  DISC Assessment Completed
                                </h3>
                                <div className="mt-2 text-sm text-green-700">
                                  <p className="mb-2">
                                    Your primary type is{" "}
                                    <strong>{formik.values.discPrimaryType}</strong>
                                    . This will be displayed on your public profile
                                    to help businesses understand your working style.
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>Dominance: {formik.values.discDominance}%</div>
                                    <div>Influence: {formik.values.discInfluence}%</div>
                                    <div>Steadiness: {formik.values.discSteadiness}%</div>
                                    <div>Conscientiousness: {formik.values.discConscientiousness}%</div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowDISCTest(true)}
                                  className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                                >
                                  Retake Assessment →
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                              DISC Personality Assessment
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Take the DISC assessment to help businesses understand your personality 
                              type and working style. The test consists of 16 questions and takes about 
                              4-6 minutes to complete.
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowDISCTest(true)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Take DISC Assessment
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Work Preferences */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    Work preferences
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Let businesses know your work preferences and availability.
                  </p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    {/* Search Status */}
                    <fieldset>
                      <legend className="text-base font-medium text-gray-900">
                        Search status
                      </legend>
                      <div className="mt-4 space-y-4">
                        <div className="flex items-start">
                          <div className="h-5 flex items-center">
                            <input
                              id="actively_looking"
                              name="searchStatus"
                              type="radio"
                              value="actively_looking"
                              checked={
                                formik.values.searchStatus ===
                                "actively_looking"
                              }
                              onChange={formik.handleChange}
                              className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor="actively_looking"
                              className="font-medium text-gray-700"
                            >
                              Actively looking
                            </label>
                            <p className="text-gray-500">
                              You're actively looking for new opportunities.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="open"
                              name="searchStatus"
                              type="radio"
                              value="open"
                              checked={formik.values.searchStatus === "open"}
                              onChange={formik.handleChange}
                              className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor="open"
                              className="font-medium text-gray-700"
                            >
                              Open to opportunities
                            </label>
                            <p className="text-gray-500">
                              You're not looking but open to hearing about new
                              opportunities.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="not_interested"
                              name="searchStatus"
                              type="radio"
                              value="not_interested"
                              checked={
                                formik.values.searchStatus === "not_interested"
                              }
                              onChange={formik.handleChange}
                              className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor="not_interested"
                              className="font-medium text-gray-700"
                            >
                              Not interested
                            </label>
                            <p className="text-gray-500">
                              You're not interested in new opportunities.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="invisible"
                              name="searchStatus"
                              type="radio"
                              value="invisible"
                              checked={
                                formik.values.searchStatus === "invisible"
                              }
                              onChange={formik.handleChange}
                              className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor="invisible"
                              className="font-medium text-gray-700"
                            >
                              Invisible
                            </label>
                            <p className="text-gray-500">
                              Your profile is hidden from search results.
                            </p>
                          </div>
                        </div>
                      </div>
                    </fieldset>

                    {/* Role Type */}
                    <fieldset>
                      <div>
                        <legend className="text-base font-medium text-gray-900">
                          Role type
                        </legend>
                        <p className="text-sm text-gray-500">
                          What type of work are you interested in?
                        </p>
                      </div>
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center">
                          <input
                            id="part_time_contract"
                            name="roleType.part_time_contract"
                            type="checkbox"
                            checked={formik.values.roleType.part_time_contract}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="part_time_contract"
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            Part-time contract
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="full_time_contract"
                            name="roleType.full_time_contract"
                            type="checkbox"
                            checked={formik.values.roleType.full_time_contract}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="full_time_contract"
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            Full-time contract
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="full_time_employment"
                            name="roleType.full_time_employment"
                            type="checkbox"
                            checked={
                              formik.values.roleType.full_time_employment
                            }
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="full_time_employment"
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            Full-time employment
                          </label>
                        </div>
                      </div>
                    </fieldset>

                    {/* Role Level */}
                    <fieldset>
                      <div>
                        <legend className="text-base font-medium text-gray-900">
                          Role level
                        </legend>
                        <p className="text-sm text-gray-500">
                          What level of role are you looking for?
                        </p>
                      </div>
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center">
                          <input
                            id="junior"
                            name="roleLevel.junior"
                            type="checkbox"
                            checked={formik.values.roleLevel.junior}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="junior"
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            Junior
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="mid"
                            name="roleLevel.mid"
                            type="checkbox"
                            checked={formik.values.roleLevel.mid}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="mid"
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            Mid
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="senior"
                            name="roleLevel.senior"
                            type="checkbox"
                            checked={formik.values.roleLevel.senior}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="senior"
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            Senior
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="principal"
                            name="roleLevel.principal"
                            type="checkbox"
                            checked={formik.values.roleLevel.principal}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="principal"
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            Principal
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="c_level"
                            name="roleLevel.c_level"
                            type="checkbox"
                            checked={formik.values.roleLevel.c_level}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="c_level"
                            className="ml-3 block text-sm font-medium text-gray-700"
                          >
                            C-level
                          </label>
                        </div>
                      </div>
                    </fieldset>

                    {/* Hourly Rate */}
                    <fieldset className="mt-6">
                      <div>
                        <legend className="text-base font-medium text-gray-900">
                          Hourly Rate Range
                        </legend>
                        <p className="text-sm text-gray-500">
                          Your preferred hourly rate range (in USD)
                        </p>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="preferredMinHourlyRate"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Minimum Rate ($/hr)
                          </label>
                          <div className="mt-1">
                            <input
                              type="number"
                              name="preferredMinHourlyRate"
                              id="preferredMinHourlyRate"
                              min="0"
                              step="1"
                              value={formik.values.preferredMinHourlyRate}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              placeholder="e.g., 25"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="preferredMaxHourlyRate"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Maximum Rate ($/hr)
                          </label>
                          <div className="mt-1">
                            <input
                              type="number"
                              name="preferredMaxHourlyRate"
                              id="preferredMaxHourlyRate"
                              min="0"
                              step="1"
                              value={formik.values.preferredMaxHourlyRate}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              placeholder="e.g., 50"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      {formik.values.preferredMinHourlyRate && formik.values.preferredMaxHourlyRate && 
                       Number(formik.values.preferredMaxHourlyRate) < Number(formik.values.preferredMinHourlyRate) && (
                        <p className="mt-2 text-sm text-red-600">
                          Maximum rate must be greater than or equal to minimum rate
                        </p>
                      )}
                    </fieldset>
                  </div>
                </div>
              </div>
            </section>

            {/* Online Presence */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    Online presence
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Where can people find you online?
                  </p>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2">
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="website"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Website
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          https://
                        </span>
                        <input
                          type="text"
                          name="website"
                          id="website"
                          value={formik.values.website}
                          onChange={formik.handleChange}
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="meta"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Facebook
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          facebook.com/
                        </span>
                        <input
                          type="text"
                          name="meta"
                          id="meta"
                          value={formik.values.meta}
                          onChange={formik.handleChange}
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="instagram"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Instagram
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          instagram.com/
                        </span>
                        <input
                          type="text"
                          name="instagram"
                          id="instagram"
                          value={formik.values.instagram}
                          onChange={formik.handleChange}
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="linkedin"
                        className="block text-sm font-medium text-gray-700"
                      >
                        LinkedIn
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          linkedin.com/in/
                        </span>
                        <input
                          type="text"
                          name="linkedin"
                          id="linkedin"
                          value={formik.values.linkedin}
                          onChange={formik.handleChange}
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="whatsapp"
                        className="block text-sm font-medium text-gray-700"
                      >
                        WhatsApp
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          +63
                        </span>
                        <input
                          type="text"
                          name="whatsapp"
                          id="whatsapp"
                          value={formik.values.whatsapp}
                          onChange={formik.handleChange}
                          placeholder="9171234567"
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="twitter"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Twitter
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          twitter.com/
                        </span>
                        <input
                          type="text"
                          name="twitter"
                          id="twitter"
                          value={formik.values.twitter}
                          onChange={formik.handleChange}
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="viber"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Viber
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                          +63
                        </span>
                        <input
                          type="text"
                          name="viber"
                          id="viber"
                          value={formik.values.viber}
                          onChange={formik.handleChange}
                          placeholder="9171234567"
                          className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Notifications */}
            <section className="bg-white shadow mt-8 px-4 py-5 lg:rounded-lg sm:p-6">
              <fieldset className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <legend className="text-lg font-medium leading-6 text-gray-900">
                    Notifications
                  </legend>
                </div>

                <div className="mt-5 md:mt-0 md:col-span-2 space-y-4">
                  <fieldset>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="h-5 flex items-center">
                          <input
                            id="profileReminderNotifications"
                            name="profileReminderNotifications"
                            type="checkbox"
                            checked={formik.values.profileReminderNotifications}
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="profileReminderNotifications"
                            className="font-medium text-gray-700"
                          >
                            Profile reminders
                          </label>
                          <p className="text-gray-500">
                            Get notified when you haven't updated your profile
                            in a while.
                          </p>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                  <fieldset>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="h-5 flex items-center">
                          <input
                            id="productAnnouncementNotifications"
                            name="productAnnouncementNotifications"
                            type="checkbox"
                            checked={
                              formik.values.productAnnouncementNotifications
                            }
                            onChange={formik.handleChange}
                            className="focus:ring-gray-500 h-4 w-4 text-gray-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="productAnnouncementNotifications"
                            className="font-medium text-gray-700"
                          >
                            Product announcements
                          </label>
                          <p className="text-gray-500">
                            Get notified about new features and updates.
                          </p>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </fieldset>
            </section>

            {/* Submit Button */}
            <div className="flex justify-end mt-8 mb-24 mr-4 sm:mr-6 lg:mr-0">
              <button
                type="submit"
                disabled={updateProfileMutation.isLoading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2663eb] hover:bg-[#1e4fc4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2663eb] disabled:opacity-50"
              >
                {updateProfileMutation.isLoading
                  ? "Updating..."
                  : "Update profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
