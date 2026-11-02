#requires -Version 5.1
<#
MischWerk: gezielte Bereinigung des geprueften Stands 0.1.100 vom 02.11.2026.
Ohne Parameter: nur pruefen. Mit -Loeschen: die 191 freigegebenen Dateien entfernen.
-Loeschen -WhatIf zeigt den Auftrag, ohne Dateien zu aendern.
Die Liste und alle SHA-256-Werte sind fest eingebaut. Keine externe JSON-Datei noetig.
Es gibt keine rekursive Dateiloeschung, Sicherung, Netzwerkverbindung oder App-Neustart.
Fehlende bekannte Loeschziele gelten bei erneutem Aufruf als bereits entfernt.
Geaenderte Dateien, Verknuepfungen oder abweichende Quellen fuehren zum Abbruch.
Node.js wird im PATH, in der vorhandenen Codex-Laufzeit und an Standardpfaden gesucht.
Optional kann -NodePfad mit dem vollstaendigen Pfad zu node.exe verwendet werden.
#>
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param([switch]$Loeschen, [string]$NodePfad)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$cleanupStarted = $false
$cleanupData = @'
{
  "Root": "C:\\Users\\Yves\\Desktop\\MischWerk",
  "Version": "0.1.100",
  "Remove": [
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aktionen-Hoerer-1360.png",
      "Bytes": 164229,
      "Hash": "46081453b955fd24142a5dcd6abedeaa075dd963d5ae7d7e8d11541c070c8fae"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aktionen-Hoerer-Deaktiviert-1360.png",
      "Bytes": 164709,
      "Hash": "8abd78d2618adcf806ba45136a1610a3ad4d2702abcbe372edeb1c14404a141b"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aktionen-Hoerer-Detail.png",
      "Bytes": 23109,
      "Hash": "4c47d03986b279541a6b44988d2f76aef11f2df0f07a2bfa727d15b46f8e498c"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aktionen-Hoerer-Mobil.png",
      "Bytes": 87399,
      "Hash": "652b91e856323dcc69c37b83d85f2699d3feb38e53d224d2ea2f2c7648bb232f"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aktionen-Inhaber-1360.png",
      "Bytes": 158743,
      "Hash": "5faec8af505e98eccdd6a2f5cde74cca67b93ca1ad0dfd63e31ef14448c14948"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aktionen-Inhaber-Detail.png",
      "Bytes": 20053,
      "Hash": "46b318697e2ff0e4b6c1f92fc963132fed6e4d44d2dd0506a69b6bf6390416ab"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aktionen-Radiomoderator-1360.png",
      "Bytes": 158132,
      "Hash": "61368167b55c39c38a83dbc12924d17b96b10b46dc91b0bc4080658bd486ff7a"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aktionen-Radiomoderator-Detail.png",
      "Bytes": 18899,
      "Hash": "eb3569d2ebc8e7f1b654a46866c1bc4e43997f0fafd8eacfa0c03f8c23c15aa6"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aufloesung-Hoerer-1920-DPR1.png",
      "Bytes": 249886,
      "Hash": "d7994bfeec21342a4abe0e2fdc0393246a696deddce31d0e47966fc1d1fa8481"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aufloesung-Hoerer-2560-DPR1.png",
      "Bytes": 326078,
      "Hash": "8276c45fd674de7a3542839987893f9d768261f8a2aeebdc88a210e5feb4efa0"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aufloesung-Hoerer-3440-DPR1.png",
      "Bytes": 426649,
      "Hash": "0c17dfe4a3af6340888779705c97f6365347714ac4f5351331656fdc51ed7f29"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aufloesung-Hoerer-3840-DPR1.png",
      "Bytes": 470793,
      "Hash": "94461cc4f179296ad93e229f355347ca0adee595f73a4bb5da2e7815446f1005"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aufloesung-Inhaber-1920-DPR1.png",
      "Bytes": 245253,
      "Hash": "89cf39562885e07d9508b7a45813354d0eeadfa8c5d4d11c10b942d46f1e103b"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aufloesung-Inhaber-2560-DPR1.png",
      "Bytes": 320861,
      "Hash": "21b2b45567759e168fb1bcb67afb0a2d7dd496c96e9f8d57fd26577f62da0588"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aufloesung-Inhaber-3440-DPR1.png",
      "Bytes": 422266,
      "Hash": "97fc06214ddd831799390f80d7a81adaa20e20a01b4288a4f00fd28f11bd5096"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aufloesung-Inhaber-3840-DPR1.png",
      "Bytes": 466195,
      "Hash": "a5ef0bc44cf983ce2f1f01e47c25971c72354574e063347f1fcf5ed4af43fecd"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aufloesung-Inhaber-3840-DPR2.png",
      "Bytes": 1480092,
      "Hash": "dd264b5d624606a3f1ecc7a39e9f9fe8f2ab55101cefd87ff63f453f68e1d880"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aufloesung-Inhaber-3840-Langtext.png",
      "Bytes": 477026,
      "Hash": "98554a5e4b8040807a51f08748c85bcd842ca78e44935c7e985b008b61bbffb2"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Aufloesung-Inhaber-3840-Pause.png",
      "Bytes": 480293,
      "Hash": "fb2768f9bcabfe35cae221e0b039a1e20f768b1226a7d498d792ed416806b2b2"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breiten-Korrektur-1024-160.png",
      "Bytes": 137480,
      "Hash": "bc3e3f6936e286f332ea5f22b17b46a667ecfb1deaa2e8516e56b3af062307dd"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breiten-Korrektur-1360-160.png",
      "Bytes": 159882,
      "Hash": "5f955313acadfd4fcb9076612fbf2466376c98f23efeeefd5e2724aef68f3bbf"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breiten-Korrektur-1490-160.png",
      "Bytes": 179166,
      "Hash": "482913a1436b4e19cd2d206e61b69fb12569fce0eb02efd7702d5dff1e074939"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breiten-Korrektur-1599-160.png",
      "Bytes": 194331,
      "Hash": "4b199845bbb5dee0371b66db497e3578490cf6c9ed0f574618920f42eccd1798"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breiten-Korrektur-1600-160.png",
      "Bytes": 194602,
      "Hash": "cb8b717af93c3a54e7bfae245cf47b6bb16ea2a8fdec0764ff3277a5cf55c458"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breiten-Korrektur-1920-160.png",
      "Bytes": 236217,
      "Hash": "6076045433065f9cc114f3d63eb980cf67a18c3daaa2e5572192644da38a4b7d"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breiten-Korrektur-320-160.png",
      "Bytes": 46921,
      "Hash": "381b9f60deef2e7f60f621c004b4ea9f6fe21c355004aaaf7eca6d5fb7e7a739"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breiten-Korrektur-320-600.png",
      "Bytes": 77552,
      "Hash": "5dd72b0af63396605de00b03682cdfc5aa8c6ae1493ebd88546bc6687e20fad1"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breiten-Korrektur-390-160.png",
      "Bytes": 51907,
      "Hash": "622b4d76ff8fa95ca1bb88c95107ab3ce4ca98a04b090f42bec9ced11b7d1efb"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breiten-Korrektur-390-600.png",
      "Bytes": 86280,
      "Hash": "97962c22e426b61dee0135f49bf36c8d593078251efb6f5f79b5e77edef830da"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breiten-Korrektur-699-160.png",
      "Bytes": 91076,
      "Hash": "36fb561f66c9164b87ba2d618b99a106a8af8fc1c7745ba3388ea838ca8e094f"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breiten-Korrektur-699-600.png",
      "Bytes": 138139,
      "Hash": "ea5a35ce9f1fe67a422b5f3a9fc0ed08aee226aa85485c3a6f942085fa2e59a5"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breiten-Korrektur-700-160.png",
      "Bytes": 91992,
      "Hash": "08f10052fb8bd6c0fd851dca05c2a682a28fc842d1f2798adb6221dcebe63d18"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Breitenfehler-Vorher-1490.png",
      "Bytes": 152598,
      "Hash": "a2329bd5f5f11b8bda2cd7b17205847cf2a8311f8e4af801e613889b47f8543e"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Emulator-PC-Hoerer-1490.png",
      "Bytes": 152682,
      "Hash": "0aaf39c7a03bb1ffd10735428aa626cacb6254b7a978ed596d882b960df2ce0a"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Emulator-PC-Hoerer-1599.png",
      "Bytes": 167609,
      "Hash": "cf55d86162e9b8975b37de174e4cd9d3518707fdf7f7f4245132ca65f6601d20"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Emulator-PC-Hoerer-1920.png",
      "Bytes": 209160,
      "Hash": "19d1a48ca5f6f1eda87c9af847c07a7947177ea7032b334dd564836c05d9cfbd"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Emulator-PC-Hoerer-390.png",
      "Bytes": 36201,
      "Hash": "b06f67dce0dacf8448a148a1d809d42420a89d7f16aec72cd8754dcc91e509e6"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Emulator-PC-Inhaber-1490.png",
      "Bytes": 157090,
      "Hash": "dd77912665485c3a0ab606f7968cb3460b00ce0a7995f9d06f50988bb5193371"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Emulator-PC-Inhaber-1599.png",
      "Bytes": 171978,
      "Hash": "15d07e2e3b075092d8d842eccaa9d3e301a82b96a973f95b70d00214790186e8"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Emulator-PC-Inhaber-1920.png",
      "Bytes": 213381,
      "Hash": "997fda122497c51891c8580efcd740ed182006ede0e1e2ef6a3fc51800690681"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Emulator-PC-Inhaber-390.png",
      "Bytes": 37516,
      "Hash": "8ed6531c060cb7e264d5b0cab295496a4794ef9373d90dd860a4eed8205d2f01"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Emulator-PC-Kontrolle.png",
      "Bytes": 193822,
      "Hash": "9119c5f7c69e802019a91f9f080522c3fde101d2164ef35900fb943e30222b73"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Hintergrund-1360.png",
      "Bytes": 174429,
      "Hash": "ada75ab93e017761ceb14218ecdafddf8c07ba8381ac2f979eb9ee5c98e812ce"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Hintergrund-320.png",
      "Bytes": 52956,
      "Hash": "708bceba494d3277de5246a961dc1558a09e4382a5e97f8653848ba78d5cc83f"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Hintergrund-390-Vollansicht.png",
      "Bytes": 113371,
      "Hash": "9ceaee5d027ac2ab46bdf353b82586a2ef3d04352ccc023f72a79408c421f20a"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Hintergrund-Detail.png",
      "Bytes": 3725,
      "Hash": "fb7a34a203e68984eaf42c34d8c63ce2dc03bdb4c3c81da9a03158e0c78473d8"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Hoererzahl-1360.png",
      "Bytes": 162774,
      "Hash": "ada15c695702d1d9f2492c93b25188c1e091722d664ac11115b700fe4775acb6"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Hoererzahl-320.png",
      "Bytes": 44259,
      "Hash": "9859438aceac61eed9a64c497ec5d4b7e188a57fe29381b2d13ce1c550f03d4d"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Hoererzahl-700.png",
      "Bytes": 83708,
      "Hash": "07675f2436a7e1eb2d626d2bb06305b0c58e5766b113da90491c2603d03ba46e"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Hoererzahl-Detail.png",
      "Bytes": 11969,
      "Hash": "5f1ec8c8eea03782e54116f937310350347ffe4cca31911dea3fcd9ac1e445aa"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Hoererzahl-Mobil-390.png",
      "Bytes": 86693,
      "Hash": "6763196b6536ef836c54a7a7f2bfc9ca9b38c179e6b9dcf1c335ce188b330870"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Live-Moderation-1360.png",
      "Bytes": 158447,
      "Hash": "01e3d451f384f585ebf495fd9320ff5a70028c468f9f5df8430928d64d4490f9"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Live-Moderation-320.png",
      "Bytes": 43925,
      "Hash": "fa4b043ac0657e289444aa1a75e313cdf3bd58225283389b9f31ecc2ba75c01d"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Live-Moderation-390-Vollansicht.png",
      "Bytes": 87467,
      "Hash": "ab0f3ae9b179d1c63376a87d4e80276209f14cbf0cb8265f23832966e49caf62"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Live-Moderation-Detail.png",
      "Bytes": 4477,
      "Hash": "553e4499add7ed51edc5443687aa79083799f65d0c79487a4764f2a32e20b533"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Moderation-Mobil.png",
      "Bytes": 100644,
      "Hash": "0a10dff82d2f1be30ae665b604bac62405fc99d8f6ef2cc8c6f2b4275db26f55"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Moderation-Musikwuensche-Mobil.png",
      "Bytes": 79241,
      "Hash": "ec400f61a912ae45936eda65451fe4db6f8fb68a1f58722100f87174398c4c3c"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Moderation.png",
      "Bytes": 176306,
      "Hash": "0f5274fbcffd2e1339d8257c7521e36e076d79f0592278447abcba369a30fdbf"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Musikkarte-Hintergrund-1920.png",
      "Bytes": 190610,
      "Hash": "a38ff51e14654ea5d92d44e62373a793a8bd734c6dafeff60b6c87313f0262ec"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Musikkarte-Hintergrund-3840.png",
      "Bytes": 408155,
      "Hash": "a2a15c163330ef528790dfd9ecf6f1fa775452847d2618a58aaa136f77808e62"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Desktop-1024.png",
      "Bytes": 142827,
      "Hash": "5e78536b42c26b824e397d1229e4f0c2d126a0e89247d90c90fa2d2695da09fd"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Desktop-1440.png",
      "Bytes": 177169,
      "Hash": "b7de48da739c862d2ce53b0a07deff457cb8683da8602e2f6fa943f64c0561ed"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Desktop-868.png",
      "Bytes": 119786,
      "Hash": "1f6e9a495f3ad9d5f232b3eb4baba68f746bda4b726a9af5b5af7434a184cc9b"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Fest-390.png",
      "Bytes": 52305,
      "Hash": "86da141a9cb4f25e599d145733740b2dd623df208a19947c24a1d12575d370e0"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Fest-Details-390.png",
      "Bytes": 52413,
      "Hash": "3834555a06a2db1149b77c5ec3a91de2babdd5f10f48c6121a1a82411a43cafc"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Leuchtrahmen-1024-Pause.png",
      "Bytes": 137108,
      "Hash": "a96985182b9d346365e0318b891138fd05dddd359d924a84f8bde288896dce57"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Leuchtrahmen-1024-Play.png",
      "Bytes": 137843,
      "Hash": "475d61bd7356462dd877ef9d72ea5831396e9bdce0b31e6ac37b1209431fe269"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Leuchtrahmen-390-Pause.png",
      "Bytes": 52799,
      "Hash": "e1e5ef9ba0b53bc17d569f6566b3e8d273f7c79e7fa32ce5f4371c3c54344867"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Leuchtrahmen-390-Play.png",
      "Bytes": 52413,
      "Hash": "3834555a06a2db1149b77c5ec3a91de2babdd5f10f48c6121a1a82411a43cafc"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Mobil-390.png",
      "Bytes": 113795,
      "Hash": "6b85b00b3160cf2a3225073046ddb4cbeacf26ba6e30056e2556884d96d5a1ab"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Studio-1360-Pause.png",
      "Bytes": 164736,
      "Hash": "b9248f40c7c8983e3575ba012b0fa774b9407f72fbb27a56b36a7c6484a678a7"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Studio-1360-Play.png",
      "Bytes": 165650,
      "Hash": "30642ff1e3e0bb43f87002ccfcc19958d7e5c3843e4c1352545b5003c150b96d"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Studio-1360.png",
      "Bytes": 164643,
      "Hash": "2ee319daa9624915a542641baca7418f7260a5c4d9e6debab0edcdf4e3959245"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Studio-2291.png",
      "Bytes": 286216,
      "Hash": "e9b8c6d7db03b13593e0ec0c786a1e2010af0e9262d2827a0bfc02e9682229e1"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Radio-Team.png",
      "Bytes": 129304,
      "Hash": "ade7c9426645baa066d5c92acfa2f95ae8c20e3490e04bdec1da886a88850e17"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Sendeplan-320.png",
      "Bytes": 94248,
      "Hash": "5af7ffe7e9a1ce0de8ba1941c3b7b05b0e5b80cb2ff5b344eb866e7cfc0a686e"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Sendeplan-820.png",
      "Bytes": 178863,
      "Hash": "4d29b3dfff17c66648f9e04e54c1474cc8639ca87babfe24161e2946d1037122"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Sendeplan-Editor.png",
      "Bytes": 157879,
      "Hash": "f7b45da089841db6e28832811d2f42d94116465e47c226c8d9acc06cd1d61d64"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Sendeplan-Neu-Editor-820.png",
      "Bytes": 199882,
      "Hash": "a074c7aa4b38c406857c2f3c6d13821b7fca0196eeaaf2582b80cead56bc44e1"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Sendeplan-Neu-Hoerer-320.png",
      "Bytes": 104712,
      "Hash": "c7d7cfb855da1e5419613b52af3a45fe8e8e10fea5763a5ffe7360ce8102f3eb"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Sendeplan-Neu-Hoerer-820.png",
      "Bytes": 263844,
      "Hash": "73b39dc447b371df1d250971e8066ed204896cd54eba8b7635d202eaba2bf2eb"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Sendeplan-Neu-Inhaber-820.png",
      "Bytes": 234665,
      "Hash": "aae0f751260bf559f12864c95173202952f8ec2df78d3e448ec49642ed83e1c7"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Statuszentrale-320.png",
      "Bytes": 93116,
      "Hash": "b1bbf7f04c5c88528c5cb18399a54bdb2ab9f568efca0d0a0e6185e02afec1f6"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Statuszentrale-560.png",
      "Bytes": 107737,
      "Hash": "0b966ae6b539ce2fbdb40eec082ea8680266096be8adcd3ddd436fc95e584b0a"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Statuszentrale-Details.png",
      "Bytes": 50589,
      "Hash": "3ca92799bb61dd1dd82cada0042488ad3a86504c8d362b10875cb27899d23d28"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Statuszentrale-Sendepause-560.png",
      "Bytes": 40374,
      "Hash": "ac11a62564c02b5c3075956cd24f52f18bc9fcb6e8ef6fcce5fd42d17a9771c2"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Wunschbox-Mobil.png",
      "Bytes": 71630,
      "Hash": "ff37338e3cf9fbfb5766810383cc60052e02be3a5f74031f6bd5d34388890d4a"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Wunschbox-Neu-320.png",
      "Bytes": 69667,
      "Hash": "78303f28fe3b2530babe493e5b454615e721fec2976cbca4da26b5f34ceaca34"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Wunschbox-Neu-520.png",
      "Bytes": 90659,
      "Hash": "cfde96320047c865b01cf37f667e9865e8cb3756992dc18c5091030dfd1b4742"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Wunschbox-Neu-Erfolg-520.png",
      "Bytes": 88862,
      "Hash": "f2ff6432652b2e9f47b9b2357115fe499bf0820eb4788740343d344e3d234244"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\design\\Wunschbox-Neu-Geschlossen-320.png",
      "Bytes": 69882,
      "Hash": "7af7a3cde1f4bbd1037522a39f868daa5ce3266ae6143d37ca0cf768f60bcf66"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\Android-schedule.png",
      "Bytes": 129068,
      "Hash": "ebdda887d4b2dd30c1aacea2b4dc3375e8831ad171ffc5b07290106a6fb406ee"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\Android-studio.png",
      "Bytes": 181845,
      "Hash": "cf12e5850b805f04e483e5318c70f7d4096c0c3a9243022ec19bc007cf8f5edd"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\Android-team.png",
      "Bytes": 133008,
      "Hash": "8d81154487080e981d4e2d778b43ee3fd2f59d668321f45b07609a44b31170e0"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\Android-wishes.png",
      "Bytes": 113992,
      "Hash": "3292e6f8daff095053e00f39704ac482a1a32f0c3e81af78fb01e7099fe9e074"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\Browser-schedule.png",
      "Bytes": 136020,
      "Hash": "760ad56665465c7d39bb682cd84b2b12ff99252cc407ee3fba1f6cceaf8a6554"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\Browser-studio.png",
      "Bytes": 198926,
      "Hash": "e0aab82cafdab2474e5ecbb1956d7ece3b2c6e0f2d2d19f1bb578a454446e46f"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\Browser-team.png",
      "Bytes": 139430,
      "Hash": "18696462d1cf789d3a14d13518aaaabb9ff6c29ace6efaded46d4a9d28ae342e"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\Browser-wishes.png",
      "Bytes": 121323,
      "Hash": "c268581c8c1c3c1a0b13e0f74fc44b6ddd4e0bf70a6808433924c994fabf706e"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\IOS-schedule.png",
      "Bytes": 127948,
      "Hash": "5cf1072d5738935e649678868c41600aa04b3bcff70f487aed0da7cf18896d81"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\IOS-studio.png",
      "Bytes": 178682,
      "Hash": "f5c1ee397420775bd2b7a1bda6e315358e3e5faf717e0e32371a3ecbf9dfb56d"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\IOS-team.png",
      "Bytes": 132425,
      "Hash": "597568acc5c89a034962d2c3b3364e635adba16626d81200e9cd898ee399367a"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\IOS-wishes.png",
      "Bytes": 112948,
      "Hash": "4f6880818cec6ed5b5e446364a5f8aec07e6cd086bb17e32cd5bd759bf7254df"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\radio-1024.png",
      "Bytes": 114000,
      "Hash": "47b52400f96d7111c3283809f8e1e2e85aef932b0771814b2de941c6df330411"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\radio-1920.png",
      "Bytes": 124740,
      "Hash": "eb637bfff271cf138fb36b8a5643b9b05ce9d2a03907ce367513a9a050de58e1"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\radio-320.png",
      "Bytes": 101782,
      "Hash": "6ed8b8773bf5cc0bafcd001e79c7baea518857c3500c2338d5e1520e53d2c7b9"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\schedule-320.png",
      "Bytes": 157059,
      "Hash": "9aca267cd7e46b758fe4bd1052ebfe39d39f77aba39e974c233ce52b9f06d4dd"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\schedule-820.png",
      "Bytes": 132988,
      "Hash": "baf9767eeef768bdaafe16c581807a46cb305dc9d820ecf02d8917c19cd2b9fa"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\studio-320.png",
      "Bytes": 173197,
      "Hash": "c97bbe95c6a42d81b20a8d51456bbd65d74e7b245eed448cd7bba3d371127051"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\studio-780.png",
      "Bytes": 170313,
      "Hash": "c16138d2af836d04ab96464bb0b65f5257098c9493d85212327a714281bc3459"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\team-320.png",
      "Bytes": 137294,
      "Hash": "d5675df4242cf5bf81b16abda3ea22d84da3608a7074d682b98ab11b44296a5b"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\team-520.png",
      "Bytes": 130962,
      "Hash": "ba07440d0e61b52a0274b0627b045b84712bf563a77f6116efea882745815b3c"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\team-560.png",
      "Bytes": 137963,
      "Hash": "cb5d33f90506b0992c6a4b64ecb3406f69b64bf41ae5907325c9324f62538943"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\wishes-320.png",
      "Bytes": 136227,
      "Hash": "418cf1e1ad45667b58efc6e8d12d9f3e2f985ea57568ca83034adf87e239159b"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\emulator\\wishes-520.png",
      "Bytes": 128229,
      "Hash": "d02f51329be246b03a1757e1f6806a93aa715f7d59e39726a35f53009da448c8"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\0-prozent.png",
      "Bytes": 4022,
      "Hash": "51974c37acd7de52b00f8bb99860763d2a5608e5a21d2068222cfbb6163f68ec"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\10-prozent.png",
      "Bytes": 20621,
      "Hash": "7e4000fcb2ad04ae507e8a68bfd650e0e70c64003a756b263fd9b356a017e644"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\100-prozent-mobil.png",
      "Bytes": 8528,
      "Hash": "95f913b5d40519bd6656788e4b21cd04bd89c88bd2838863e93955f9d892bed2"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\100-prozent.png",
      "Bytes": 21655,
      "Hash": "3760084e0f5f8d256a141705f2f8ecc1c4bb369b520694ab61e3d29c13da08e9"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\Appleiste-Regler-1024.png",
      "Bytes": 94246,
      "Hash": "3259231afe9b4b7c09ecaa048e72e959fd72526e7945fb100ddd8589b7ea8bfc"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\Appleiste-Regler-1487.png",
      "Bytes": 87776,
      "Hash": "c71cd48482d9ef91b72652db3558d8a1ed1b501e4ecdb58d5e9c41caefbf1d68"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\Appleiste-Regler-2124.png",
      "Bytes": 102502,
      "Hash": "59de55751004ca4b5ddbb927c880439d41ec70ec42f4f2fbd9af3cde71cb7f89"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\Appleiste-Regler-320.png",
      "Bytes": 69250,
      "Hash": "3ec289c287fc13ad12dcce704060a95595d8a564727bcc7aa5d3efef45deb225"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\Appleiste-Regler-768.png",
      "Bytes": 85739,
      "Hash": "b4dd72dd44da1599a4e38b3647527c55c9758d1d12e61f20f6ae46df29659721"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\Schmal-Zentrierung-1024.png",
      "Bytes": 76206,
      "Hash": "6ee4791aceae52a8bc06b76cdbf9d49416f4cdf5880735a976d23c55659ce754"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\Schmal-Zentrierung-320.png",
      "Bytes": 65341,
      "Hash": "16bda59fdb8b8b27392c0ee31838568af5eaa1204a41089c71662a91a8a60114"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\Schmal-Zentrierung-393.png",
      "Bytes": 68164,
      "Hash": "b1dcc18bdf1de1d4a93cdbd0a54ff5a3bac10f4b08807930046c6a1e04603802"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\Schmal-Zentrierung-600.png",
      "Bytes": 72763,
      "Hash": "cadd68713b38435048e83e008830a807506b7830988bf53f047d439de36b0480"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke\\Schmal-Zentrierung-768.png",
      "Bytes": 73182,
      "Hash": "fe7730d4703c08241372efdf2b8f8f708fef7b4edf2fd5a62edef5fbb801def4"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Ausrichtung-1024.png",
      "Bytes": 70776,
      "Hash": "24c9b22879456296bd46e55d90fe13de5f69cfe50141960a7d35003fb2f8397a"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Ausrichtung-1200.png",
      "Bytes": 75123,
      "Hash": "9bbea881d78c7007e919b3d2974ca7ebc4fd94ce1dc55d629b1db642435fd3f1"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Ausrichtung-1487.png",
      "Bytes": 69550,
      "Hash": "f62c4ed815cf258478cbeabf3ef2477e09e88ffda6e8beeebc15fcc6dec83075"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Ausrichtung-2124.png",
      "Bytes": 78366,
      "Hash": "01acaf1f2ddc37a57356f548cd91ea69b058d3af6c81af5776069f31914ac50a"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Ausrichtung-320.png",
      "Bytes": 63433,
      "Hash": "9276e505253a3605e9151b24ccb73dca14d1e836f395afb06890894c6f2bd1e1"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Ausrichtung-768.png",
      "Bytes": 67759,
      "Hash": "b4bd0c9748773b86f1f395e85a87e40955579c3dec962ed390bc5dfc735de4d0"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Leiste-2124.png",
      "Bytes": 74861,
      "Hash": "3f499748df3294ca03bf67eabe0b4fa233b802a98d54a98c483e1bf3a2089f65"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Leiste-320.png",
      "Bytes": 48509,
      "Hash": "a249d54c89b59f490f6e8eaffcb150faa958b7e613f723d53606d969a15edde3"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Leiste-681.png",
      "Bytes": 46236,
      "Hash": "93aa189334921d21aa0a5c58efec4a735a500df2106b03419b70ee278f95b008"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Leiste-960.png",
      "Bytes": 55208,
      "Hash": "d6e3949599bd4f88051e6aa3051b56fecbf4d0030b87204e85aace066bc829e9"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Leiste-On-Air-2124.png",
      "Bytes": 81672,
      "Hash": "d176c995f18f4c7b05511dea76c04641d9fbcbb7e71b4ce7deaa01013d9d4222"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Leiste-Wiedergabe-2124.png",
      "Bytes": 79612,
      "Hash": "2080f9c0d1dd3a24f3cf5444c59d427970807600d6dbe4da92429c3f66a79c1a"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Leiste-Wiedergabe-320.png",
      "Bytes": 47501,
      "Hash": "ab7680bbb0230d25cc18cbd458ef4d84d73aee3b94cc08dd59b4e566b6cbb4fa"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Moderation-Schrift.png",
      "Bytes": 4835,
      "Hash": "7f4712fbccfa5ff52f21dfc348333412b4f3fd29c9f29e37c8856985e88f88d2"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Moderation-Wunschbox.png",
      "Bytes": 17368,
      "Hash": "f80e228c34ad8d36c3ffbeda4d879d6a2f47a9ae6164f36f9374aa048b4b54f2"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Musikflaeche-Wiedergabe.png",
      "Bytes": 30289,
      "Hash": "af72ca4117f69cca5bc50b5076179a10a795a029f5dea54f2c9021803a99ddf3"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Pause-Symbol-320.png",
      "Bytes": 5376,
      "Hash": "5efd16a586b00655e12962e95f01b62184cda0056e0130b0f2f31e72ed72f71d"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Pause-Symbol.png",
      "Bytes": 10571,
      "Hash": "2dc7e4ef23e1ffa6355d65d97fda3587068ba40d7dfffd5ea448abae1f34a97b"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Titel-Interpret-320.png",
      "Bytes": 45792,
      "Hash": "32d1bbbcea5750d6c24470ad2fd5fc9a7515b3e3bb7d29f518c276236452b312"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Titel-Interpret.png",
      "Bytes": 81409,
      "Hash": "1240af848d32ec2c4754476fcae1bd12ab7e9e9d3c0efae83566c669bff9da67"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Typografie-2124.png",
      "Bytes": 84258,
      "Hash": "5f73efd336c935080b8468c27fd5a2d777e924f88b890c539d59fe39e1500007"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Typografie-320.png",
      "Bytes": 66891,
      "Hash": "9ad3f5ca7757993b11d7924960cfe014100bdb9ada152d391b9485952118eb94"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\leiste\\Typografie-Musikdaten.png",
      "Bytes": 34830,
      "Hash": "e01074a2eeb28fb26bcccccac0609a5b09782843da58d91657b83152e2b1912e"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\radiostatus\\Sendepause-2124.png",
      "Bytes": 7978,
      "Hash": "13344ff325bcb3aa258f20ba501c06d5712bca9f8a9ff68c4d42dc603524bd74"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\radiostatus\\Sendepause-320.png",
      "Bytes": 4620,
      "Hash": "0bf8a17a0f273a54b8822db8a5fbb6d2fcd06aa8ca7db2be06136e3a36174912"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\radiostatus\\Sendepause-Leiste-2124.png",
      "Bytes": 258332,
      "Hash": "6f541b645d7baaf07fa677bb3049b9db27af105013ceeed010f657672e51b7af"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\radiostatus\\Sendepause-Leiste-320.png",
      "Bytes": 43172,
      "Hash": "16d6974d0bc5ab7f5f5ff986621f7beeba99593e28d3fc61fcfc062dd287efdc"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\sendeplan\\Leiste-Sendeplan-320.png",
      "Bytes": 48126,
      "Hash": "8163e31b559d2cb499bb2804306215fe2654f44dd10289e8c4df96f4d066be52"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\sendeplan\\Leiste-Sendeplan-960.png",
      "Bytes": 62971,
      "Hash": "702897ab1fd37a476368dcf6385d38414a2833613dea472d52b931c907b630ca"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\sendeplan\\Sendeplan-320.png",
      "Bytes": 42079,
      "Hash": "1a61d7c000401fe4b6f6975f42d2f854ce2ff09ed224fec156e1ab37755f7832"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\sendeplan\\Sendeplan-820.png",
      "Bytes": 53702,
      "Hash": "d9937b1b673f238b9071a349b22f6c14901f6c7240dc9ec15710b8742d991e47"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\sendeplan\\Sendeplan-Dynamisch-Belegt.png",
      "Bytes": 62287,
      "Hash": "eea7b3413e83250d5da6291e8cf95cad9b849ca4033d3ea72d217fdcc86b676e"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\sendeplan\\Sendeplan-Dynamisch-Leer.png",
      "Bytes": 47763,
      "Hash": "fd66739b828061d1d9216deb31e951da496bf118f1dc1c40b3cc8c712381ed78"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\sendeplan\\Sendeplan-Zukunft-Gespeichert.png",
      "Bytes": 51687,
      "Hash": "1d73c9907011485e52925f95c30dcc1e2a001f3ac69e00d1514a97416c11a6f3"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\sendeplan\\Sendeplan-Zukunft.png",
      "Bytes": 39015,
      "Hash": "d1a8c7efbb2e7515737b117a700af6297291557913f2d79a1bf1710ea46067b1"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\studio\\Studio-780.png",
      "Bytes": 108443,
      "Hash": "e3a7818512bceaed904d7e21ee0b548a340ebcedcf30ae409b98435b3a57857f"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\studio\\Studio-Leer-780.png",
      "Bytes": 90765,
      "Hash": "609e8641523d65ecba02e1bc230b301158e0eedf7d40464edd3926094b985440"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\studio\\Studio-Uebergabebutton-320.png",
      "Bytes": 68043,
      "Hash": "ea07cc0e116b3cc048d69365bcdb547ea08b06553d80a809d6fe170b1f1c5ed7"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\studio\\Studio-Uebergabebutton.png",
      "Bytes": 101070,
      "Hash": "6eb011d7a62d962a2732c0ba3d68f911bb13a11c38d6e4dbc850cc538913a47f"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\studio\\Studio-Wuensche-320.png",
      "Bytes": 78599,
      "Hash": "48b6158800673b2e35c9527b52d70b77a7261ee8db1200c2f613c85dad096b3e"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\studio\\Uebergabe-Annehmen.png",
      "Bytes": 29172,
      "Hash": "c798443de3f45caa0cee8578c4bfadbcd5c2e0058c6f29065638a012ee9170ca"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\studio\\Uebergabe-Warten.png",
      "Bytes": 25819,
      "Hash": "fe550adba088ba9a3b4f6e0fd0937c90a856acbd21d17adf5f2a69c20448edeb"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\wunschbox\\Wunschbox-320.png",
      "Bytes": 18150,
      "Hash": "ffe0410e3ba1ec32271301d34178dfe17cbd04f3cfdac8979e2a6e7e8eb23676"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\wunschbox\\Wunschbox-520.png",
      "Bytes": 18948,
      "Hash": "98c49ea8bbd8bd0a439fbb8096c3105fc9460cb0de515ecc14d7c36f04ae00c7"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\wunschbutton\\Deaktiviert-2124.png",
      "Bytes": 4243,
      "Hash": "808e2156e6df7c5e90118da75a1d477f4d7485704ae6216e4bdee92dab0f7e97"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\wunschbutton\\Deaktiviert-320.png",
      "Bytes": 4347,
      "Hash": "4cd4705b22e36246e93f78f5137a8f951984bdcc8a2f8a874cb1e42d4160cdf8"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\wunschbutton\\Deaktiviert-681.png",
      "Bytes": 3957,
      "Hash": "443314d9f1db573d09cf0da9520a593dc4c4fd2731e388bb15dbdc20cda2daec"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\bilder\\wunschbutton\\Deaktiviert-901.png",
      "Bytes": 4213,
      "Hash": "2aa45f15c289096d300413588f31bd3ae82102082402162b7b4d562109b5f1a7"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\emulator\\clientansichten-aktuell.json",
      "Bytes": 1951,
      "Hash": "29e34c87a5cbe847ef4cf65be69973d4714cf8a0059af9bb22acac7a50e61fa0"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\emulator\\lautstaerke-aktuell.json",
      "Bytes": 34658,
      "Hash": "35bbc4dafede2eb50c72a82b9578e379e514f5fa049654058ff4f68437dcb473"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\emulator\\pruefung-aktuell.json",
      "Bytes": 5590,
      "Hash": "6bd695817a8f0882921560ae621e5e75ca3926094a59b50d17ca4d032a6bb3ff"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\emulator\\schmal-zentrierung-aktuell.json",
      "Bytes": 168171,
      "Hash": "1b3b9c63d3019f973ccd177d0b4709025f0e4576fae3774c53d6eb5dccba67a9"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\radioking\\MischWerk-RadioKing-aktuell.png",
      "Bytes": 262708,
      "Hash": "9a9bbecc379840a2ae348967b0bb227c8c38c6782b755edc357afaa3bdbdbeb9"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\radioking\\MischWerk-RadioKing-Wiedergabe.png",
      "Bytes": 69682,
      "Hash": "e3d7cefb36756204a7c8d44177811337dbfed535eb0cc14a9339eed8b3cd9e95"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\radioking\\RadioKing-Sendepause.png",
      "Bytes": 7462,
      "Hash": "962b650a3c9c91cb28187c66bf389d1c69a47c7ce8da5e957618e2d0950024e6"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\radioking\\Statuszentrale-RadioKing-aktuell.png",
      "Bytes": 72017,
      "Hash": "090cc1d56de6c2a8759b8fb3b901df3afd1fe5ec81bcd0135c354ffd12dc3460"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\radioking\\Statuszentrale-RadioKing-schmal.png",
      "Bytes": 76333,
      "Hash": "6979dff9225d95f776e83a6ac9a58bf3ee57ddad0f98137079ab44bf5f430796"
    },
    {
      "Path": "PROJEKT\\references\\design\\design-referenz.png",
      "Bytes": 1225536,
      "Hash": "d7756edf9f4c67c6d2edcfdd6ab41a1f782ceaff8cadd9bc6b50323e984e05d9"
    },
    {
      "Path": "PROJEKT\\references\\design\\MischWerk-Skizze-Dialoge.png",
      "Bytes": 287159,
      "Hash": "9052e3087df9f955422f8e6f85cfdd02ae29f7ad936b4e919c3afa312a98a73f"
    },
    {
      "Path": "PROJEKT\\references\\design\\MischWerk-Skizze-Radio.png",
      "Bytes": 270382,
      "Hash": "4fd1968e4999255d4eaf8e271d9c8a786f413b8da1f7f5514dbd8af98c5ecc55"
    },
    {
      "Path": "PROJEKT\\tools\\compare-frontend.cjs",
      "Bytes": 5761,
      "Hash": "1df2def5aba518d967c79919d218124a01c56398ddb0deef3d53fbca8bc33136"
    },
    {
      "Path": "UPLOAD\\MischWerk.zip",
      "Bytes": 1245365,
      "Hash": "3f0160df82183a1843b859c9447f084e65295fd8112451c3f369b18a7f0bad9b"
    }
  ],
  "Protected": [
    {
      "Path": ".gitattributes",
      "Bytes": 289,
      "Hash": "6c91bdd5ee0e1c1d077e82793e03e2ba61119f96e990f2c82f522c52eb62c917"
    },
    {
      "Path": ".gitignore",
      "Bytes": 243,
      "Hash": "aa29c54940c34695fb776a0ca19c7737779f37e391d5bf2451a1f04ea69bf5d3"
    },
    {
      "Path": "AGENTS.md",
      "Bytes": 428,
      "Hash": "cb0758126fb1a72740b10681433f41abf7b29f1b1349b45ffff003944205efbf"
    },
    {
      "Path": "ANLEITUNGEN\\INSTALLIEREN-LIVE.md",
      "Bytes": 10110,
      "Hash": "ca05b26ef42c8d150e74ab28f18bd155ce55b2bca358f0ff6bfb3733acd94a26"
    },
    {
      "Path": "ANLEITUNGEN\\Paket\\manifest-live.json",
      "Bytes": 683,
      "Hash": "d84264f38ab79e28243db2c280926b23f0161af84aa9cc3e10ee3150aa9580a0"
    },
    {
      "Path": "ANLEITUNGEN\\Paket\\manifest-server.json",
      "Bytes": 4731,
      "Hash": "49422651c55fc1e386949d5f148f0a73dd4614355b55abc47ed7189e5427f58a"
    },
    {
      "Path": "ANLEITUNGEN\\Paket\\manifest-www.json",
      "Bytes": 8775,
      "Hash": "d8ae988d2b830eef4c346a06a16da3c339020ae85b15131a530eb8f1367db1cc"
    },
    {
      "Path": "ANLEITUNGEN\\Paket\\MischWerk-Knuddels-LIVE-0.1.100.zip",
      "Bytes": 1245365,
      "Hash": "3f0160df82183a1843b859c9447f084e65295fd8112451c3f369b18a7f0bad9b"
    },
    {
      "Path": "ANLEITUNGEN\\Paket\\SHA256-LIVE.txt",
      "Bytes": 102,
      "Hash": "64b8edb4f68299dd091cfcc1f15ff3128ca6b4e9487702c4851abf6efed354b4"
    },
    {
      "Path": "ANLEITUNGEN\\RADIOKING-EINRICHTUNG.txt",
      "Bytes": 8322,
      "Hash": "e782476a3a25fa0ab89a107cb7f9c10ed8c608cfb4a859a6d35324e2a4b40485"
    },
    {
      "Path": "PROJEKT\\AGENTS.md",
      "Bytes": 64822,
      "Hash": "594557746f742b6e73eb86f26eec7b8f71d845bf96ac6bbd28efed5e26b7ec9a"
    },
    {
      "Path": "PROJEKT\\app\\app.config",
      "Bytes": 525,
      "Hash": "9ab88286d8bb3d98569bd3f5b880022887e105b38feafc0ac3fd8b559479e967"
    },
    {
      "Path": "PROJEKT\\app\\main.js",
      "Bytes": 163,
      "Hash": "f8ec2aafafdd549f690b92448858c599d66b5916069f3dd114566c6238d0313d"
    },
    {
      "Path": "PROJEKT\\app\\server\\app.js",
      "Bytes": 3248,
      "Hash": "87c874c4bc728fd1d16fcc758f9e523c3021cbce7bf3223003e50dc4fd148f5a"
    },
    {
      "Path": "PROJEKT\\app\\server\\config.js",
      "Bytes": 485,
      "Hash": "39b56d5e1fecdde428a4271dfb8d1d239ef02238b69d7af20f28f13ce329eab5"
    },
    {
      "Path": "PROJEKT\\app\\server\\core\\diagnostics.js",
      "Bytes": 1519,
      "Hash": "a8b774ac4c60b3f03fa9c1195df940000e278509725912be7fc3418f513f9fa5"
    },
    {
      "Path": "PROJEKT\\app\\server\\core\\runtime.js",
      "Bytes": 1182,
      "Hash": "6089c3dc7e57c24945961b3299cc040d32513a4f11b1d19ad82cc0fcfa369615"
    },
    {
      "Path": "PROJEKT\\app\\server\\core\\validation.js",
      "Bytes": 1653,
      "Hash": "713619db2058ac27fb715481a5c8d9a0862f186acf30e394a28db9f94280f23b"
    },
    {
      "Path": "PROJEKT\\app\\server\\lifecycle.js",
      "Bytes": 2581,
      "Hash": "e1b48ad310f7b9ad4174e6394a0299d0692642a04bb2d688c51f786bc9c2c43b"
    },
    {
      "Path": "PROJEKT\\app\\server\\maintenance.js",
      "Bytes": 3279,
      "Hash": "b80ff0e5ab6bcaa46a675a3bb6bd4712d47497d3495a76acc412ddd7e971c305"
    },
    {
      "Path": "PROJEKT\\app\\server\\radio\\announcements.js",
      "Bytes": 2524,
      "Hash": "19f6f935462e0796fb5a2ab5099f002c84922e3c736030fc55f7c0d42528e086"
    },
    {
      "Path": "PROJEKT\\app\\server\\radio\\handover.js",
      "Bytes": 4358,
      "Hash": "54beb9307fac52fd0a57fbdaa8246f140030534c38f8959b9fd742cc048c7b1c"
    },
    {
      "Path": "PROJEKT\\app\\server\\radio\\moderation.js",
      "Bytes": 3446,
      "Hash": "d928ee3c10ad6bd920344aa7b06efe9c618c2bfc12d193d1a6e34b364a9edf63"
    },
    {
      "Path": "PROJEKT\\app\\server\\radio\\show.js",
      "Bytes": 1246,
      "Hash": "5e59be90063347007f553ee1b6c5da3c04d0b22b55e823b33c23c6ce23201f31"
    },
    {
      "Path": "PROJEKT\\app\\server\\radio\\station.js",
      "Bytes": 825,
      "Hash": "b04cc5d448f750ad308aba6e58bd8ed5d55fcc4b259ec5e2712fcc4dfcfd525c"
    },
    {
      "Path": "PROJEKT\\app\\server\\radio\\team.js",
      "Bytes": 3612,
      "Hash": "7bf701510fc0c952eff30d9b690e82d20fe286c91041c22bb2c1366697250c49"
    },
    {
      "Path": "PROJEKT\\app\\server\\schedule\\calendar.js",
      "Bytes": 2160,
      "Hash": "87f7af1ae09e339e3aec9d4f2eef66686e37a4f5f4a80d51c58109fbb09aad45"
    },
    {
      "Path": "PROJEKT\\app\\server\\schedule\\programme.js",
      "Bytes": 5117,
      "Hash": "a6f325f5efdb68ddd25456432f29dcf74e22136c1cb24d6a67b86af8d5d8c427"
    },
    {
      "Path": "PROJEKT\\app\\server\\schedule\\storage.js",
      "Bytes": 2492,
      "Hash": "47f5c89878f9fbed5ddbca9cf9f22892386efc3a105f13311a82163078387c96"
    },
    {
      "Path": "PROJEKT\\app\\server\\schedule\\transport.js",
      "Bytes": 2145,
      "Hash": "5ae08a5d7d0a096f05e1016a8935d2d4a9a915bfc92b7f1ea915fb650aed7305"
    },
    {
      "Path": "PROJEKT\\app\\server\\state\\initialization.js",
      "Bytes": 352,
      "Hash": "c5d2fc18842a0ac6980d3aab80c5eb74252069ddb51403292acfa5eed25ddb55"
    },
    {
      "Path": "PROJEKT\\app\\server\\state\\persistence.js",
      "Bytes": 4763,
      "Hash": "78ef39f6860ef14de5e9c4e8935d6d64e526c3308c59981b6b68cb9df1eb3cb0"
    },
    {
      "Path": "PROJEKT\\app\\server\\transport\\events.js",
      "Bytes": 4479,
      "Hash": "1ff9382356f880061a16e7ee6dd36e09ec51129a983d0ffac45dd5b8f871ea2e"
    },
    {
      "Path": "PROJEKT\\app\\server\\transport\\views.js",
      "Bytes": 2509,
      "Hash": "18243dffe2a3f759d9a3cfd5ac68bb47819a36a5ce152e6b8d4126f32474c26b"
    },
    {
      "Path": "PROJEKT\\app\\server\\ui\\sessions.js",
      "Bytes": 4292,
      "Hash": "8133ca37c916fef759bf92a87d3b4b093fa9884e41a07c40995231ddcb26babf"
    },
    {
      "Path": "PROJEKT\\app\\server\\ui\\snapshot.js",
      "Bytes": 3020,
      "Hash": "8d9d8fab381d647c51b313bf302ef5ca8c3c44b5fc4a6389bd135d1becbea6cd"
    },
    {
      "Path": "PROJEKT\\app\\server\\users\\identity.js",
      "Bytes": 1032,
      "Hash": "5a27929ae8c07463481f23af33c506644ca27d91e6c030667e8d459630277fe4"
    },
    {
      "Path": "PROJEKT\\app\\server\\wishes\\queue.js",
      "Bytes": 5243,
      "Hash": "89f1268148e51d6825ab493d5239ee2e4d169fc6e56c81f79224984c3582064b"
    },
    {
      "Path": "PROJEKT\\app\\server\\wishes\\transport.js",
      "Bytes": 2026,
      "Hash": "7fd70588970b1c5f49057a1ca47500767dfca637e54029fa37191b4cf89731d8"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\dialogs-responsive.css",
      "Bytes": 2209,
      "Hash": "06f76ecd328dae1557ee8fb829b99a52dc2b1588ec4096eca68aa2fa150ff997"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\dialogs.css",
      "Bytes": 7019,
      "Hash": "89e2a26db7f81d9b801234d4cef4abbde028a7ee7618520e89868463e6adf0df"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\feedback.css",
      "Bytes": 639,
      "Hash": "3654e8ce6e2fb87928fda9f136c37da20528bdee963f2875f8c23caeb5996f04"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\foundation.css",
      "Bytes": 1621,
      "Hash": "cccf9f161b830479c956d9594e2fd11f7b3ae2c3ea20f9638cfcb6fa3875fefa"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\handover.css",
      "Bytes": 656,
      "Hash": "3833729a970d44d78351466fa8d66a2af462a35b9cb7a18d377cfbe21d92a65b"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\metadata-layout.css",
      "Bytes": 1812,
      "Hash": "fb4e93c0caf32b50c74319fc0a11d9b9f8359c1563589d46ed6a9bbaef8d5af7"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\radio-actions.css",
      "Bytes": 4760,
      "Hash": "6982585ab383a6b43dcbacef012f673442362d6c1a76438b8de1822661d15084"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\radio-responsive.css",
      "Bytes": 3792,
      "Hash": "fec957a4c41b35240a69bfab7c86288feac2b8fef4ce279c48d7dcf46c93f75f"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\radio-surface.css",
      "Bytes": 3836,
      "Hash": "1c7cb4239f1828e70d1b4176a5c488ffc57a35e3352350326f739dd24a09bdf6"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\radio.css",
      "Bytes": 4933,
      "Hash": "0dd299e455597f269ac80f9a5640cb8ca0c5714b43f6e6842f949fe778cba79f"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\schedule.css",
      "Bytes": 4863,
      "Hash": "9246327e881d9d18df318a286831cfb010cc5b2d1938a474b966008433c9168f"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\studio.css",
      "Bytes": 4953,
      "Hash": "d8ac089aa20175812cad5faff21bd591d2c4b4c4597efeb406fdbf40dee30fa8"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\team-status.css",
      "Bytes": 3789,
      "Hash": "23bdaac94b91f6ad99786dd393e34e21703921a479a28ec5a80ec03167f93ca1"
    },
    {
      "Path": "PROJEKT\\app\\www\\css\\team.css",
      "Bytes": 801,
      "Hash": "8d345b3c6f0f366552880ec2e807e31c35212747be515e9ecee31e526c1c1569"
    },
    {
      "Path": "PROJEKT\\app\\www\\img\\mischwerk-logo.png",
      "Bytes": 1343064,
      "Hash": "52460b961dbd63a6dac985cc3d031019c2425878c6ac7962e19b6086bc050d0a"
    },
    {
      "Path": "PROJEKT\\app\\www\\index.html",
      "Bytes": 2798,
      "Hash": "e7c6e3fa5799556d3eb832c288a642c4ccf0e4cdaa5628c4bc8dd934590238b3"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\app.js",
      "Bytes": 301,
      "Hash": "2e57ec55d9558097b3d94ba005659b1d9779373c11e9be7f959ca2d98313de91"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\core\\dom.js",
      "Bytes": 1437,
      "Hash": "14de84712e14277894a5a1b55b5095ddc67dbea7f6d8d734dee1a2ef4bf10904"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\core\\model.js",
      "Bytes": 1976,
      "Hash": "94794820aaeb29f2c840b8aadd51c60738049ff1136271269fbef6ba5e895afd"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\core\\signals.js",
      "Bytes": 421,
      "Hash": "236f7c95b0c068dd033904d93dd96e2476b4651231c15cfa463e896b48ecb953"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\radio\\api.js",
      "Bytes": 4802,
      "Hash": "1c02f5c172db1ca65f046ef8e473d94ffc2c8a532a142a92a74c316f7415064b"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\radio\\listeners.js",
      "Bytes": 2687,
      "Hash": "9f42dc76193ea05d17ecd9ceb56960912de3b4dc473b31e31efb0abc11ced14b"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\radio\\markup.js",
      "Bytes": 5874,
      "Hash": "bc05630485b6ce0367d51cb76543df632e60affeed8f8c3d38e4f7105c6d8b23"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\radio\\player.js",
      "Bytes": 6742,
      "Hash": "25f327273e51a95a2fd62e22d138b0410df7408f7823c22c512cfc0463ddaae2"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\radio\\presentation.js",
      "Bytes": 2436,
      "Hash": "535fc725f63ab4de252415bf1e1470044bfac3d487ba459e3ca0da974213ca65"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\radio\\provider.js",
      "Bytes": 4879,
      "Hash": "35bac9bf02224f5874718bd228f234129beeb6b0f11d9689e5a49dc0bd72b2e0"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\radio\\viewport.js",
      "Bytes": 1990,
      "Hash": "f7bcf0d4dda091478424598ad2d8a00c0fa6cef42444460dfd22fdf5687cb255"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\radio\\volume.js",
      "Bytes": 2910,
      "Hash": "fda07503e91142b34b975fd6b2470cdcebef898530ac3701dfd8968611f8988a"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\schedule\\calendar.js",
      "Bytes": 1168,
      "Hash": "bfbf66cd93989608b27f2d9c697b2ff2fb41213c045f83f4cbf46fc7969f42a0"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\schedule\\controller.js",
      "Bytes": 8256,
      "Hash": "1cb6e09f9b6a870f03dc00989455664b98c0245e8499c9543591b7ba78bae9ee"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\schedule\\editor.js",
      "Bytes": 3720,
      "Hash": "fdf3da176dbdba0705fad2faef3e55d525d27c6978e8d1b6f8ecdac1856a8049"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\schedule\\markup.js",
      "Bytes": 3775,
      "Hash": "df06df386208e9accd1868d232b69e5be3e55b50ab78e800ceb2892d41df554d"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\schedule\\pages.js",
      "Bytes": 4163,
      "Hash": "0248e0e737d6612782cf69c0d81a4bbcc5672ffbedbedaf2db1cc0938f48a4bb"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\schedule\\view.js",
      "Bytes": 2747,
      "Hash": "eacb2cb5bb2a7d87587807f94b3403b9c2c50987ac7db5d8219265f34e0112d2"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\schedule\\window.js",
      "Bytes": 3398,
      "Hash": "602e21ed462a8a1dad11d11b0a374a05c1500bfed39039a39f05633dda998154"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\start.js",
      "Bytes": 6038,
      "Hash": "c9f009aff51ed394c1be639c8b5ab812889395941d8cf70aede0a65f1d85631e"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\studio\\controls.js",
      "Bytes": 5320,
      "Hash": "419c563ee2add2493d9eb6e89d0033e12bb9e3f056f077a2bfd04aa0727cadbd"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\studio\\handover-markup.js",
      "Bytes": 1479,
      "Hash": "f831545eb6b668d32c526beaa529d0293c76e6f2b9179673df5cd3d338e5f995"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\studio\\handover.js",
      "Bytes": 5026,
      "Hash": "3a292e64a93195b7e6fccf19416a122884005795712c7ef28ef9a182a45da404"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\studio\\markup.js",
      "Bytes": 4374,
      "Hash": "7f3f16851599d7882632aa1da1947f015d524747ade394ddf730fba7e038f8d7"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\studio\\queue.js",
      "Bytes": 4654,
      "Hash": "8b91279c7f3cda40b7d427a0b6f1284089486bbe9ed0d61ef403e9f75bbbcaba"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\team\\management.js",
      "Bytes": 4123,
      "Hash": "360ac7724585906efd4e230db7e921db359583a3490992c05f52dfb81e52d423"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\team\\markup.js",
      "Bytes": 2150,
      "Hash": "1b9c729fea59503c4272bd97de31df138df6f4f2534afe9e92f0ae1f586a61f9"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\team\\status-markup.js",
      "Bytes": 3838,
      "Hash": "ef6788755d526a38ab4e1fd840fe5ab793b8db1e80c849be9b59f9fff0677a5f"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\team\\status-view.js",
      "Bytes": 5892,
      "Hash": "6ca0cbc0ac58d69b4e643f85c2eb60fbf9f8741fa879b6b856d5fd8a961a05c6"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\team\\status.js",
      "Bytes": 3761,
      "Hash": "66d696b738af53599d3f852488c63290595f837ff977efbc8361d544e2612221"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\transport\\commands.js",
      "Bytes": 3199,
      "Hash": "05f68ec52e708adb88cfe371468ad9d0ea4a2344c7dbc0c009d1000df824f5ce"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\transport\\lifecycle.js",
      "Bytes": 2866,
      "Hash": "5d0f92880d8dcb58c5125b16126b7d9012a2f6ad666aaed3e730fe6bddbc4a91"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\ui\\layout.js",
      "Bytes": 4934,
      "Hash": "2ddc3a43eb5460843999ac66bec3a67cd2a9cef4281d7f913d7a65f2315fda0d"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\ui\\updates.js",
      "Bytes": 1964,
      "Hash": "97b734d49f1f0381154b06559059f334075824c61b33da78c7e4da0dd4c006a7"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\wishes\\markup.js",
      "Bytes": 1164,
      "Hash": "1116469101f4aa02a8856a532c52619a02717b53c73538f33156c826bcbf8982"
    },
    {
      "Path": "PROJEKT\\app\\www\\js\\wishes\\wishbox.js",
      "Bytes": 6605,
      "Hash": "33cacae419b1742e2a5c07bdd700c41c9653959e6a963235f3c770e0cf4f3cb8"
    },
    {
      "Path": "PROJEKT\\deployment\\live.json",
      "Bytes": 465,
      "Hash": "c0c8886ae5fd266d5975c860e0371fbc7c68e154a4a59df22eed6260d7a4be54"
    },
    {
      "Path": "PROJEKT\\docs\\api\\API-NACHWEIS.md",
      "Bytes": 48637,
      "Hash": "ed5b3ee242b69b4f25a6a69987519d678eb5261ed087bdcdb57c34d943815b51"
    },
    {
      "Path": "PROJEKT\\docs\\api\\API-WIKI-ABGLEICH.md",
      "Bytes": 8082,
      "Hash": "de812657984ee803bb39adb0dabb1931c435ffb1c6c18f3c0daaf7f4c411e193"
    },
    {
      "Path": "PROJEKT\\docs\\architektur\\ARCHITEKTUR-FRONTEND.md",
      "Bytes": 21946,
      "Hash": "3a313f4e3414a7b214d57c22df5a6c855a5108149d5f2981a98a6114b0dbc81f"
    },
    {
      "Path": "PROJEKT\\docs\\architektur\\ARCHITEKTUR.md",
      "Bytes": 23269,
      "Hash": "3db457d2bf352da3dc21e50bf3d55add11ebe02b26cbb086aa17bc4db57b5b89"
    },
    {
      "Path": "PROJEKT\\docs\\architektur\\DESIGN.md",
      "Bytes": 25241,
      "Hash": "e9a842146dbf48c5249ef73a1b6303f09600043ea5893b8aec1cbb0cc49b166f"
    },
    {
      "Path": "PROJEKT\\docs\\betrieb\\INBETRIEBNAHME.md",
      "Bytes": 8663,
      "Hash": "655a47d6dcfcc8f71a0824a8ac10ed1a8145865aa456db674c88bf49edaa2fa4"
    },
    {
      "Path": "PROJEKT\\docs\\betrieb\\LAUTSTAERKE.md",
      "Bytes": 3245,
      "Hash": "96e5c0a825fddd1a160b7d67bd8d161deb9bde21d6e1224efd1e7e8e1923d5ac"
    },
    {
      "Path": "PROJEKT\\docs\\betrieb\\LIVE-ABNAHME.md",
      "Bytes": 13489,
      "Hash": "2b3f2b90147789fc7de10acf8ed13769e5004f9133c499be7eef688b15f7416a"
    },
    {
      "Path": "PROJEKT\\docs\\betrieb\\SENDEPLAN.md",
      "Bytes": 4589,
      "Hash": "f4b1be86eaae6faa7de81bfbbeeaa744b8d34b4c07b4e613f3492f353fc1125a"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\PRUEFBERICHT.md",
      "Bytes": 4163,
      "Hash": "02a0b86d0f7c8b1850d59905621e5d1fe7b728c696da7ce64c8893bc2fb7c38a"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\radioking\\anbindung-aktuell.json",
      "Bytes": 3804,
      "Hash": "01ad65dbef18f047c92c04862480ab096828da3696b12576a178e2eca0ba78ce"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\radioking\\anbindung-wiedergabe.json",
      "Bytes": 2980,
      "Hash": "119074f6f5127ced75893b8df295a79c486c8f35ce4c569030bfa74dcc056e0b"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\radioking\\statuszentrale-aktuell.json",
      "Bytes": 2282,
      "Hash": "51da24c7c77b53fc64026b2e84401c18b5ba2e4bfdb80602071c8e84697439b5"
    },
    {
      "Path": "PROJEKT\\package.json",
      "Bytes": 1033,
      "Hash": "ab131de9b5241267db5cbb2e5dec810b0ca5cec0b10505247df16727b1fa07ce"
    },
    {
      "Path": "PROJEKT\\pnpm-lock.yaml",
      "Bytes": 1011,
      "Hash": "90cfd4cfba3ce3dc21bc33a35eb6e8b6f3771e258a0b142d449313c8322d7abd"
    },
    {
      "Path": "PROJEKT\\README.md",
      "Bytes": 7481,
      "Hash": "acd4d9f2f7086daeb84db95d1d88a1eb182921aa2f1db63b121e4da7f05ac2a6"
    },
    {
      "Path": "PROJEKT\\references\\api\\knuddels-userapp-backend-api.js",
      "Bytes": 156030,
      "Hash": "ec2a1993a50b2cf14e2dcaaa20fe44c715730b836288570d4bef4a1faa69dcc0"
    },
    {
      "Path": "PROJEKT\\references\\api\\knuddels-webapp-frontend-api.js",
      "Bytes": 10883,
      "Hash": "2022e8b5ce856b6e20ee697d62f225384ee772f5274ce86c77d3a9142bd47b87"
    },
    {
      "Path": "PROJEKT\\src\\backend\\app.js",
      "Bytes": 3248,
      "Hash": "87c874c4bc728fd1d16fcc758f9e523c3021cbce7bf3223003e50dc4fd148f5a"
    },
    {
      "Path": "PROJEKT\\src\\backend\\config.js",
      "Bytes": 485,
      "Hash": "39b56d5e1fecdde428a4271dfb8d1d239ef02238b69d7af20f28f13ce329eab5"
    },
    {
      "Path": "PROJEKT\\src\\backend\\core\\diagnostics.js",
      "Bytes": 1519,
      "Hash": "a8b774ac4c60b3f03fa9c1195df940000e278509725912be7fc3418f513f9fa5"
    },
    {
      "Path": "PROJEKT\\src\\backend\\core\\runtime.js",
      "Bytes": 1182,
      "Hash": "6089c3dc7e57c24945961b3299cc040d32513a4f11b1d19ad82cc0fcfa369615"
    },
    {
      "Path": "PROJEKT\\src\\backend\\core\\validation.js",
      "Bytes": 1653,
      "Hash": "713619db2058ac27fb715481a5c8d9a0862f186acf30e394a28db9f94280f23b"
    },
    {
      "Path": "PROJEKT\\src\\backend\\lifecycle.js",
      "Bytes": 2581,
      "Hash": "e1b48ad310f7b9ad4174e6394a0299d0692642a04bb2d688c51f786bc9c2c43b"
    },
    {
      "Path": "PROJEKT\\src\\backend\\maintenance.js",
      "Bytes": 3279,
      "Hash": "b80ff0e5ab6bcaa46a675a3bb6bd4712d47497d3495a76acc412ddd7e971c305"
    },
    {
      "Path": "PROJEKT\\src\\backend\\radio\\announcements.js",
      "Bytes": 2524,
      "Hash": "19f6f935462e0796fb5a2ab5099f002c84922e3c736030fc55f7c0d42528e086"
    },
    {
      "Path": "PROJEKT\\src\\backend\\radio\\handover.js",
      "Bytes": 4358,
      "Hash": "54beb9307fac52fd0a57fbdaa8246f140030534c38f8959b9fd742cc048c7b1c"
    },
    {
      "Path": "PROJEKT\\src\\backend\\radio\\moderation.js",
      "Bytes": 3446,
      "Hash": "d928ee3c10ad6bd920344aa7b06efe9c618c2bfc12d193d1a6e34b364a9edf63"
    },
    {
      "Path": "PROJEKT\\src\\backend\\radio\\show.js",
      "Bytes": 1246,
      "Hash": "5e59be90063347007f553ee1b6c5da3c04d0b22b55e823b33c23c6ce23201f31"
    },
    {
      "Path": "PROJEKT\\src\\backend\\radio\\station.js",
      "Bytes": 825,
      "Hash": "b04cc5d448f750ad308aba6e58bd8ed5d55fcc4b259ec5e2712fcc4dfcfd525c"
    },
    {
      "Path": "PROJEKT\\src\\backend\\radio\\team.js",
      "Bytes": 3612,
      "Hash": "7bf701510fc0c952eff30d9b690e82d20fe286c91041c22bb2c1366697250c49"
    },
    {
      "Path": "PROJEKT\\src\\backend\\schedule\\calendar.js",
      "Bytes": 2160,
      "Hash": "87f7af1ae09e339e3aec9d4f2eef66686e37a4f5f4a80d51c58109fbb09aad45"
    },
    {
      "Path": "PROJEKT\\src\\backend\\schedule\\programme.js",
      "Bytes": 5117,
      "Hash": "a6f325f5efdb68ddd25456432f29dcf74e22136c1cb24d6a67b86af8d5d8c427"
    },
    {
      "Path": "PROJEKT\\src\\backend\\schedule\\storage.js",
      "Bytes": 2492,
      "Hash": "47f5c89878f9fbed5ddbca9cf9f22892386efc3a105f13311a82163078387c96"
    },
    {
      "Path": "PROJEKT\\src\\backend\\schedule\\transport.js",
      "Bytes": 2145,
      "Hash": "5ae08a5d7d0a096f05e1016a8935d2d4a9a915bfc92b7f1ea915fb650aed7305"
    },
    {
      "Path": "PROJEKT\\src\\backend\\state\\initialization.js",
      "Bytes": 352,
      "Hash": "c5d2fc18842a0ac6980d3aab80c5eb74252069ddb51403292acfa5eed25ddb55"
    },
    {
      "Path": "PROJEKT\\src\\backend\\state\\persistence.js",
      "Bytes": 4763,
      "Hash": "78ef39f6860ef14de5e9c4e8935d6d64e526c3308c59981b6b68cb9df1eb3cb0"
    },
    {
      "Path": "PROJEKT\\src\\backend\\transport\\events.js",
      "Bytes": 4479,
      "Hash": "1ff9382356f880061a16e7ee6dd36e09ec51129a983d0ffac45dd5b8f871ea2e"
    },
    {
      "Path": "PROJEKT\\src\\backend\\transport\\views.js",
      "Bytes": 2509,
      "Hash": "18243dffe2a3f759d9a3cfd5ac68bb47819a36a5ce152e6b8d4126f32474c26b"
    },
    {
      "Path": "PROJEKT\\src\\backend\\ui\\sessions.js",
      "Bytes": 4292,
      "Hash": "8133ca37c916fef759bf92a87d3b4b093fa9884e41a07c40995231ddcb26babf"
    },
    {
      "Path": "PROJEKT\\src\\backend\\ui\\snapshot.js",
      "Bytes": 3020,
      "Hash": "8d9d8fab381d647c51b313bf302ef5ca8c3c44b5fc4a6389bd135d1becbea6cd"
    },
    {
      "Path": "PROJEKT\\src\\backend\\users\\identity.js",
      "Bytes": 1032,
      "Hash": "5a27929ae8c07463481f23af33c506644ca27d91e6c030667e8d459630277fe4"
    },
    {
      "Path": "PROJEKT\\src\\backend\\wishes\\queue.js",
      "Bytes": 5243,
      "Hash": "89f1268148e51d6825ab493d5239ee2e4d169fc6e56c81f79224984c3582064b"
    },
    {
      "Path": "PROJEKT\\src\\backend\\wishes\\transport.js",
      "Bytes": 2026,
      "Hash": "7fd70588970b1c5f49057a1ca47500767dfca637e54029fa37191b4cf89731d8"
    },
    {
      "Path": "PROJEKT\\tests\\announcements.test.cjs",
      "Bytes": 7548,
      "Hash": "7b48c529e2ef023e239185e4afce90baaadbddef74183c0fbb8468f727adacd6"
    },
    {
      "Path": "PROJEKT\\tests\\audio-fixture.cjs",
      "Bytes": 942,
      "Hash": "25ff7fd78f3067ea789f6084156ddf5050f9b492d0f570dfe3f125d76734495d"
    },
    {
      "Path": "PROJEKT\\tests\\backend.test.cjs",
      "Bytes": 57953,
      "Hash": "8afc13d47c29b60ebbe75303ae8e07de50add4c1176f2d1fa5d71eb647f73895"
    },
    {
      "Path": "PROJEKT\\tests\\frontend.browser.test.cjs",
      "Bytes": 161144,
      "Hash": "bb8080903b6ab86ec0ccfdaff72686d01972291f5e84f3df592233fffc1ab78a"
    },
    {
      "Path": "PROJEKT\\tests\\handover.browser.test.cjs",
      "Bytes": 8565,
      "Hash": "9777b13fa81b8263bf27427517daae41a85a209dd4e17cbf5a4402e2ae6b3797"
    },
    {
      "Path": "PROJEKT\\tests\\handover.test.cjs",
      "Bytes": 9379,
      "Hash": "55d49463259b48e7698b3dc26e6efbabd1855f5a65a755dc905645d2de752058"
    },
    {
      "Path": "PROJEKT\\tests\\preview.test.cjs",
      "Bytes": 3510,
      "Hash": "c5175b1b4accef46568f950c1a5316756f35015b2425452bd0c7962fcd78d681"
    },
    {
      "Path": "PROJEKT\\tests\\rhino-wish.js",
      "Bytes": 12164,
      "Hash": "7ac0125fc4f34bb761ebc4d0eff02b15dfcf87f6c7ca02f1357cc3b43f101154"
    },
    {
      "Path": "PROJEKT\\tests\\schedule.browser.test.cjs",
      "Bytes": 33491,
      "Hash": "7c1e2f22fa4b67336ba955dcf29419c9def27a580da310713e0e0ea8fdbaa3fa"
    },
    {
      "Path": "PROJEKT\\tests\\schedule.test.cjs",
      "Bytes": 13474,
      "Hash": "d69019c736e3c294bc789d86b01bb4d3fc2ca1c1e1b548614e17a3a85c340451"
    },
    {
      "Path": "PROJEKT\\tools\\build-backend.cjs",
      "Bytes": 3485,
      "Hash": "6b690a556c1b37d2d2e6e7f11d49fc9b49e4645a8d6f3ae8592d7f9f41877dcb"
    },
    {
      "Path": "PROJEKT\\tools\\build-install.cjs",
      "Bytes": 7484,
      "Hash": "b09fb9fda5177fb3ab229ea4bb1d30c2bb2dd850556d342344755c457dacd4a4"
    },
    {
      "Path": "PROJEKT\\tools\\check-architecture.cjs",
      "Bytes": 3381,
      "Hash": "b8c847ca8ed621be79e9ba5f8435f535376336ad3257898c3cf2b777305030c1"
    },
    {
      "Path": "PROJEKT\\tools\\check-file-lengths.cjs",
      "Bytes": 2081,
      "Hash": "0e437846384615795d5ecf97d9688c8f3763705779b24793624f5fc1014f20a0"
    },
    {
      "Path": "PROJEKT\\tools\\check-package.cjs",
      "Bytes": 4264,
      "Hash": "9c69e47f5cfa88b60db253f1575b58f5180a8ce852e8e66f602df63fd9c1e6d5"
    },
    {
      "Path": "PROJEKT\\tools\\check-rhino.cjs",
      "Bytes": 3464,
      "Hash": "cd8184355882f9b778d6036d74d4ebb44b3e95dfc125d61bffd954c4092d97fe"
    },
    {
      "Path": "PROJEKT\\tools\\check.cjs",
      "Bytes": 5778,
      "Hash": "65ba0ea41bc1d1c0441dbdd84850b8106336e6d16dad31a70877b798a01236e5"
    },
    {
      "Path": "PROJEKT\\tools\\frontend-files.cjs",
      "Bytes": 904,
      "Hash": "88ce0f9f4505b5ac17cc7244c493c061f641c01df36d6daa638176af2157da1d"
    },
    {
      "Path": "PROJEKT\\tools\\knuddels-mock.cjs",
      "Bytes": 8051,
      "Hash": "9469e85844d86fda490f492639da00d21588128aa457dfdac85d8990adf29e0d"
    },
    {
      "Path": "PROJEKT\\tools\\preview\\bridge.js",
      "Bytes": 2929,
      "Hash": "c023b88bc404da9340974e7ea4905ca21b325a259fbf59083a5aaaa3afeaeef4"
    },
    {
      "Path": "PROJEKT\\tools\\preview\\index.html",
      "Bytes": 2111,
      "Hash": "ae666a5e7d1b8041e20212fcd261651fca783a355fcca38306fadffbc71eaf22"
    },
    {
      "Path": "PROJEKT\\tools\\preview.cjs",
      "Bytes": 6505,
      "Hash": "a26cd90515467e750ac9487fa1c1b7e6f5cf402e0ca05c5e5de7af5b395dcd91"
    },
    {
      "Path": "PROJEKT\\tools\\radioking-compatibility-check.cjs",
      "Bytes": 10823,
      "Hash": "ffc3eef82163e0cae80f043add4d59c89302e8fc0896b4ab948cbe20bdf6838b"
    },
    {
      "Path": "PROJEKT\\tools\\radioking-status-check.cjs",
      "Bytes": 5045,
      "Hash": "f7a321f37c98e0177eeb675b57b68a9f5a41cbf3dff57c33ada14ddb1f173c12"
    },
    {
      "Path": "UPLOAD\\MischWerk\\app.config",
      "Bytes": 525,
      "Hash": "9ab88286d8bb3d98569bd3f5b880022887e105b38feafc0ac3fd8b559479e967"
    },
    {
      "Path": "UPLOAD\\MischWerk\\main.js",
      "Bytes": 163,
      "Hash": "f8ec2aafafdd549f690b92448858c599d66b5916069f3dd114566c6238d0313d"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\app.js",
      "Bytes": 3248,
      "Hash": "87c874c4bc728fd1d16fcc758f9e523c3021cbce7bf3223003e50dc4fd148f5a"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\config.js",
      "Bytes": 485,
      "Hash": "39b56d5e1fecdde428a4271dfb8d1d239ef02238b69d7af20f28f13ce329eab5"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\core\\diagnostics.js",
      "Bytes": 1519,
      "Hash": "a8b774ac4c60b3f03fa9c1195df940000e278509725912be7fc3418f513f9fa5"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\core\\runtime.js",
      "Bytes": 1182,
      "Hash": "6089c3dc7e57c24945961b3299cc040d32513a4f11b1d19ad82cc0fcfa369615"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\core\\validation.js",
      "Bytes": 1653,
      "Hash": "713619db2058ac27fb715481a5c8d9a0862f186acf30e394a28db9f94280f23b"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\lifecycle.js",
      "Bytes": 2581,
      "Hash": "e1b48ad310f7b9ad4174e6394a0299d0692642a04bb2d688c51f786bc9c2c43b"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\maintenance.js",
      "Bytes": 3279,
      "Hash": "b80ff0e5ab6bcaa46a675a3bb6bd4712d47497d3495a76acc412ddd7e971c305"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\radio\\announcements.js",
      "Bytes": 2524,
      "Hash": "19f6f935462e0796fb5a2ab5099f002c84922e3c736030fc55f7c0d42528e086"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\radio\\handover.js",
      "Bytes": 4358,
      "Hash": "54beb9307fac52fd0a57fbdaa8246f140030534c38f8959b9fd742cc048c7b1c"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\radio\\moderation.js",
      "Bytes": 3446,
      "Hash": "d928ee3c10ad6bd920344aa7b06efe9c618c2bfc12d193d1a6e34b364a9edf63"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\radio\\show.js",
      "Bytes": 1246,
      "Hash": "5e59be90063347007f553ee1b6c5da3c04d0b22b55e823b33c23c6ce23201f31"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\radio\\station.js",
      "Bytes": 825,
      "Hash": "b04cc5d448f750ad308aba6e58bd8ed5d55fcc4b259ec5e2712fcc4dfcfd525c"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\radio\\team.js",
      "Bytes": 3612,
      "Hash": "7bf701510fc0c952eff30d9b690e82d20fe286c91041c22bb2c1366697250c49"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\schedule\\calendar.js",
      "Bytes": 2160,
      "Hash": "87f7af1ae09e339e3aec9d4f2eef66686e37a4f5f4a80d51c58109fbb09aad45"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\schedule\\programme.js",
      "Bytes": 5117,
      "Hash": "a6f325f5efdb68ddd25456432f29dcf74e22136c1cb24d6a67b86af8d5d8c427"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\schedule\\storage.js",
      "Bytes": 2492,
      "Hash": "47f5c89878f9fbed5ddbca9cf9f22892386efc3a105f13311a82163078387c96"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\schedule\\transport.js",
      "Bytes": 2145,
      "Hash": "5ae08a5d7d0a096f05e1016a8935d2d4a9a915bfc92b7f1ea915fb650aed7305"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\state\\initialization.js",
      "Bytes": 352,
      "Hash": "c5d2fc18842a0ac6980d3aab80c5eb74252069ddb51403292acfa5eed25ddb55"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\state\\persistence.js",
      "Bytes": 4763,
      "Hash": "78ef39f6860ef14de5e9c4e8935d6d64e526c3308c59981b6b68cb9df1eb3cb0"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\transport\\events.js",
      "Bytes": 4479,
      "Hash": "1ff9382356f880061a16e7ee6dd36e09ec51129a983d0ffac45dd5b8f871ea2e"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\transport\\views.js",
      "Bytes": 2509,
      "Hash": "18243dffe2a3f759d9a3cfd5ac68bb47819a36a5ce152e6b8d4126f32474c26b"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\ui\\sessions.js",
      "Bytes": 4292,
      "Hash": "8133ca37c916fef759bf92a87d3b4b093fa9884e41a07c40995231ddcb26babf"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\ui\\snapshot.js",
      "Bytes": 3020,
      "Hash": "8d9d8fab381d647c51b313bf302ef5ca8c3c44b5fc4a6389bd135d1becbea6cd"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\users\\identity.js",
      "Bytes": 1032,
      "Hash": "5a27929ae8c07463481f23af33c506644ca27d91e6c030667e8d459630277fe4"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\wishes\\queue.js",
      "Bytes": 5243,
      "Hash": "89f1268148e51d6825ab493d5239ee2e4d169fc6e56c81f79224984c3582064b"
    },
    {
      "Path": "UPLOAD\\MischWerk\\server\\wishes\\transport.js",
      "Bytes": 2026,
      "Hash": "7fd70588970b1c5f49057a1ca47500767dfca637e54029fa37191b4cf89731d8"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\dialogs-responsive.css",
      "Bytes": 2209,
      "Hash": "06f76ecd328dae1557ee8fb829b99a52dc2b1588ec4096eca68aa2fa150ff997"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\dialogs.css",
      "Bytes": 7019,
      "Hash": "89e2a26db7f81d9b801234d4cef4abbde028a7ee7618520e89868463e6adf0df"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\feedback.css",
      "Bytes": 639,
      "Hash": "3654e8ce6e2fb87928fda9f136c37da20528bdee963f2875f8c23caeb5996f04"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\foundation.css",
      "Bytes": 1621,
      "Hash": "cccf9f161b830479c956d9594e2fd11f7b3ae2c3ea20f9638cfcb6fa3875fefa"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\handover.css",
      "Bytes": 656,
      "Hash": "3833729a970d44d78351466fa8d66a2af462a35b9cb7a18d377cfbe21d92a65b"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\metadata-layout.css",
      "Bytes": 1812,
      "Hash": "fb4e93c0caf32b50c74319fc0a11d9b9f8359c1563589d46ed6a9bbaef8d5af7"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\radio-actions.css",
      "Bytes": 4760,
      "Hash": "6982585ab383a6b43dcbacef012f673442362d6c1a76438b8de1822661d15084"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\radio-responsive.css",
      "Bytes": 3792,
      "Hash": "fec957a4c41b35240a69bfab7c86288feac2b8fef4ce279c48d7dcf46c93f75f"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\radio-surface.css",
      "Bytes": 3836,
      "Hash": "1c7cb4239f1828e70d1b4176a5c488ffc57a35e3352350326f739dd24a09bdf6"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\radio.css",
      "Bytes": 4933,
      "Hash": "0dd299e455597f269ac80f9a5640cb8ca0c5714b43f6e6842f949fe778cba79f"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\schedule.css",
      "Bytes": 4863,
      "Hash": "9246327e881d9d18df318a286831cfb010cc5b2d1938a474b966008433c9168f"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\studio.css",
      "Bytes": 4953,
      "Hash": "d8ac089aa20175812cad5faff21bd591d2c4b4c4597efeb406fdbf40dee30fa8"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\team-status.css",
      "Bytes": 3789,
      "Hash": "23bdaac94b91f6ad99786dd393e34e21703921a479a28ec5a80ec03167f93ca1"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\css\\team.css",
      "Bytes": 801,
      "Hash": "8d345b3c6f0f366552880ec2e807e31c35212747be515e9ecee31e526c1c1569"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\img\\mischwerk-logo.png",
      "Bytes": 1343064,
      "Hash": "52460b961dbd63a6dac985cc3d031019c2425878c6ac7962e19b6086bc050d0a"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\index.html",
      "Bytes": 2798,
      "Hash": "e7c6e3fa5799556d3eb832c288a642c4ccf0e4cdaa5628c4bc8dd934590238b3"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\app.js",
      "Bytes": 301,
      "Hash": "2e57ec55d9558097b3d94ba005659b1d9779373c11e9be7f959ca2d98313de91"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\core\\dom.js",
      "Bytes": 1437,
      "Hash": "14de84712e14277894a5a1b55b5095ddc67dbea7f6d8d734dee1a2ef4bf10904"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\core\\model.js",
      "Bytes": 1976,
      "Hash": "94794820aaeb29f2c840b8aadd51c60738049ff1136271269fbef6ba5e895afd"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\core\\signals.js",
      "Bytes": 421,
      "Hash": "236f7c95b0c068dd033904d93dd96e2476b4651231c15cfa463e896b48ecb953"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\radio\\api.js",
      "Bytes": 4802,
      "Hash": "1c02f5c172db1ca65f046ef8e473d94ffc2c8a532a142a92a74c316f7415064b"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\radio\\listeners.js",
      "Bytes": 2687,
      "Hash": "9f42dc76193ea05d17ecd9ceb56960912de3b4dc473b31e31efb0abc11ced14b"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\radio\\markup.js",
      "Bytes": 5874,
      "Hash": "bc05630485b6ce0367d51cb76543df632e60affeed8f8c3d38e4f7105c6d8b23"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\radio\\player.js",
      "Bytes": 6742,
      "Hash": "25f327273e51a95a2fd62e22d138b0410df7408f7823c22c512cfc0463ddaae2"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\radio\\presentation.js",
      "Bytes": 2436,
      "Hash": "535fc725f63ab4de252415bf1e1470044bfac3d487ba459e3ca0da974213ca65"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\radio\\provider.js",
      "Bytes": 4879,
      "Hash": "35bac9bf02224f5874718bd228f234129beeb6b0f11d9689e5a49dc0bd72b2e0"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\radio\\viewport.js",
      "Bytes": 1990,
      "Hash": "f7bcf0d4dda091478424598ad2d8a00c0fa6cef42444460dfd22fdf5687cb255"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\radio\\volume.js",
      "Bytes": 2910,
      "Hash": "fda07503e91142b34b975fd6b2470cdcebef898530ac3701dfd8968611f8988a"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\schedule\\calendar.js",
      "Bytes": 1168,
      "Hash": "bfbf66cd93989608b27f2d9c697b2ff2fb41213c045f83f4cbf46fc7969f42a0"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\schedule\\controller.js",
      "Bytes": 8256,
      "Hash": "1cb6e09f9b6a870f03dc00989455664b98c0245e8499c9543591b7ba78bae9ee"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\schedule\\editor.js",
      "Bytes": 3720,
      "Hash": "fdf3da176dbdba0705fad2faef3e55d525d27c6978e8d1b6f8ecdac1856a8049"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\schedule\\markup.js",
      "Bytes": 3775,
      "Hash": "df06df386208e9accd1868d232b69e5be3e55b50ab78e800ceb2892d41df554d"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\schedule\\pages.js",
      "Bytes": 4163,
      "Hash": "0248e0e737d6612782cf69c0d81a4bbcc5672ffbedbedaf2db1cc0938f48a4bb"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\schedule\\view.js",
      "Bytes": 2747,
      "Hash": "eacb2cb5bb2a7d87587807f94b3403b9c2c50987ac7db5d8219265f34e0112d2"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\schedule\\window.js",
      "Bytes": 3398,
      "Hash": "602e21ed462a8a1dad11d11b0a374a05c1500bfed39039a39f05633dda998154"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\start.js",
      "Bytes": 6038,
      "Hash": "c9f009aff51ed394c1be639c8b5ab812889395941d8cf70aede0a65f1d85631e"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\studio\\controls.js",
      "Bytes": 5320,
      "Hash": "419c563ee2add2493d9eb6e89d0033e12bb9e3f056f077a2bfd04aa0727cadbd"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\studio\\handover-markup.js",
      "Bytes": 1479,
      "Hash": "f831545eb6b668d32c526beaa529d0293c76e6f2b9179673df5cd3d338e5f995"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\studio\\handover.js",
      "Bytes": 5026,
      "Hash": "3a292e64a93195b7e6fccf19416a122884005795712c7ef28ef9a182a45da404"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\studio\\markup.js",
      "Bytes": 4374,
      "Hash": "7f3f16851599d7882632aa1da1947f015d524747ade394ddf730fba7e038f8d7"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\studio\\queue.js",
      "Bytes": 4654,
      "Hash": "8b91279c7f3cda40b7d427a0b6f1284089486bbe9ed0d61ef403e9f75bbbcaba"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\team\\management.js",
      "Bytes": 4123,
      "Hash": "360ac7724585906efd4e230db7e921db359583a3490992c05f52dfb81e52d423"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\team\\markup.js",
      "Bytes": 2150,
      "Hash": "1b9c729fea59503c4272bd97de31df138df6f4f2534afe9e92f0ae1f586a61f9"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\team\\status-markup.js",
      "Bytes": 3838,
      "Hash": "ef6788755d526a38ab4e1fd840fe5ab793b8db1e80c849be9b59f9fff0677a5f"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\team\\status-view.js",
      "Bytes": 5892,
      "Hash": "6ca0cbc0ac58d69b4e643f85c2eb60fbf9f8741fa879b6b856d5fd8a961a05c6"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\team\\status.js",
      "Bytes": 3761,
      "Hash": "66d696b738af53599d3f852488c63290595f837ff977efbc8361d544e2612221"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\transport\\commands.js",
      "Bytes": 3199,
      "Hash": "05f68ec52e708adb88cfe371468ad9d0ea4a2344c7dbc0c009d1000df824f5ce"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\transport\\lifecycle.js",
      "Bytes": 2866,
      "Hash": "5d0f92880d8dcb58c5125b16126b7d9012a2f6ad666aaed3e730fe6bddbc4a91"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\ui\\layout.js",
      "Bytes": 4934,
      "Hash": "2ddc3a43eb5460843999ac66bec3a67cd2a9cef4281d7f913d7a65f2315fda0d"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\ui\\updates.js",
      "Bytes": 1964,
      "Hash": "97b734d49f1f0381154b06559059f334075824c61b33da78c7e4da0dd4c006a7"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\wishes\\markup.js",
      "Bytes": 1164,
      "Hash": "1116469101f4aa02a8856a532c52619a02717b53c73538f33156c826bcbf8982"
    },
    {
      "Path": "UPLOAD\\MischWerk\\www\\js\\wishes\\wishbox.js",
      "Bytes": 6605,
      "Hash": "33cacae419b1742e2a5c07bdd700c41c9653959e6a963235f3c770e0cf4f3cb8"
    }
  ],
  "EmptyDirectories": [
    "PROJEKT\\docs\\pruefung\\bilder",
    "PROJEKT\\docs\\pruefung\\bilder\\design",
    "PROJEKT\\docs\\pruefung\\bilder\\emulator",
    "PROJEKT\\docs\\pruefung\\bilder\\lautstaerke",
    "PROJEKT\\docs\\pruefung\\bilder\\leiste",
    "PROJEKT\\docs\\pruefung\\bilder\\radiostatus",
    "PROJEKT\\docs\\pruefung\\bilder\\sendeplan",
    "PROJEKT\\docs\\pruefung\\bilder\\studio",
    "PROJEKT\\docs\\pruefung\\bilder\\wunschbox",
    "PROJEKT\\docs\\pruefung\\bilder\\wunschbutton",
    "PROJEKT\\docs\\pruefung\\emulator",
    "PROJEKT\\references\\design"
  ],
  "Changes": [
    {
      "Path": "PROJEKT\\tools\\build-install.cjs",
      "BeforeHash": "b09fb9fda5177fb3ab229ea4bb1d30c2bb2dd850556d342344755c457dacd4a4",
      "Replacements": [
        {
          "Old": "uploadEntries.every(name => name === live.appKey || name === live.appKey + '.zip')",
          "New": "uploadEntries.every(name => name === live.appKey)"
        },
        {
          "Old": "  // Die vom Nutzer verwendete kurze ZIP-Adresse enthält stets dasselbe geprüfte Paket.\n  const uploadArchive = path.join(path.dirname(upload), live.appKey + '.zip');\n  fs.copyFileSync(archive, uploadArchive);\n  assert.equal(digest(uploadArchive), digest(archive), 'Kurzes Upload-ZIP weicht vom geprüften Paket ab');\n",
          "New": ""
        }
      ],
      "AfterHash": "665339df524332c7c4224d90f9676db2abb5c2e9b0856c843b03bb6188901bd5"
    },
    {
      "Path": "PROJEKT\\AGENTS.md",
      "BeforeHash": "594557746f742b6e73eb86f26eec7b8f71d845bf96ac6bbd28efed5e26b7ec9a",
      "Replacements": [
        {
          "Old": "- Auf ausdrücklichen Aufräumauftrag vom 31.10.2026: genau ein aktueller Prüfbericht unter `docs/pruefung/PRUEFBERICHT.md`, Oberflächenbilder thematisch unter `docs/pruefung/bilder/`, echte Anbieterprüfungen unter `docs/pruefung/radioking/`. Erzeugte Nachweise an festen Pfaden ersetzen; keine versionsweisen Bericht-/Screenshot-Kopien ansammeln. Eigenständige Nachweise zur Audioverbindung und zum Rhino-Wunschfehler erhalten und ihren Prüfzeitpunkt kenntlich lassen. Vorschau-Assets gehören unter `tools/preview/`; keine Root-Starthelfer neu anlegen.",
          "New": "- Auf ausdrücklichen erneuten Aufräumauftrag vom 02.11.2026: genau ein aktueller Prüfbericht unter `docs/pruefung/PRUEFBERICHT.md`. Alte Oberflächenbilder, Designreferenzen und Emulatormessungen entfernen; keine Screenshot- oder Versionssammlungen aufbewahren. Neue Screenshots nur bei Bedarf erzeugen. Datierte technische JSON-Nachweise zur echten RadioKing-Anbindung sowie der Rhino-Fehlernachweis bleiben erhalten. Vorschau-Assets gehören unter `tools/preview/`; keine Root-Starthelfer neu anlegen."
        },
        {
          "Old": "Seit 0.1.63 gilt der vom Nutzer zur Ausführung freigegebene Designauftrag mit korrigierten Skizzen unter references/design/.",
          "New": "Seit 0.1.63 gilt der vom Nutzer zur Ausführung freigegebene Designauftrag; die gültige Gestaltung ist in diesen Regeln und docs/architektur/DESIGN.md festgehalten."
        },
        {
          "Old": "Aktuell: lokale Version 0.1.100 mit RadioKing. Diese Regeln gelten dauerhaft im gesamten MischWerk-Projekt. Frühere Versionsarchive wurden auf ausdrücklichen Nutzerwunsch vom 31.10.2026 entfernt; für neue Arbeiten gelten ausschließlich die hier festgehaltenen Regeln.",
          "New": "Aktuell: lokale Version 0.1.100 mit RadioKing. Diese Regeln gelten dauerhaft im gesamten MischWerk-Projekt. Frühere Versionsarchive wurden auf ausdrücklichen Nutzerwunsch vom 31.10.2026 entfernt; für neue Arbeiten gelten ausschließlich die hier festgehaltenen Regeln.\r\n\r\nOrdnerbereinigung vom 02.11.2026: 191 ausdrücklich freigegebene Dateien entfernt. Nur das aktuelle ZIP unter ANLEITUNGEN/Paket behalten; keine zweite ZIP-Kopie unter UPLOAD erzeugen. Quellen, notwendige Laufzeit-/Uploadkopien, Original-Logo, Git, installierte Entwicklungsabhängigkeiten, Tests, API-Referenzen und aktuelle Anleitungen bleiben erhalten. Die App-Version bleibt 0.1.100."
        }
      ],
      "AfterHash": "115a715115cac6e79ca2a5dfe6b6954b3c222fd356f309de2a0b4bdda5072161"
    },
    {
      "Path": "PROJEKT\\README.md",
      "BeforeHash": "acd4d9f2f7086daeb84db95d1d88a1eb182921aa2f1db63b121e4da7f05ac2a6",
      "Replacements": [
        {
          "Old": "| `references/design/` | Originale Gestaltungsreferenz |\n",
          "New": ""
        },
        {
          "Old": "- [Aktueller Prüfbericht](docs/pruefung/PRUEFBERICHT.md). Oberflächenbilder liegen gesammelt unter `docs/pruefung/bilder/`, echte Anbieterprüfungen unter `docs/pruefung/radioking/`.",
          "New": "- [Aktueller Prüfbericht](docs/pruefung/PRUEFBERICHT.md). Die datierten technischen Anbieterprüfungen bleiben unter `docs/pruefung/radioking/`; alte Oberflächenbilder und Designreferenzen wurden auf Nutzerwunsch entfernt."
        },
        {
          "Old": "Prüfbericht und erzeugte Nachweise werden an festen Pfaden aktualisiert. Die aufbewahrte RadioKing-Wiedergabeprüfung und der Rhino-Fehlernachweis dokumentieren eigenständige Ergebnisse; Datum und damalige Version bleiben darin erkennbar.",
          "New": "Prüfbericht und technische Nachweise werden an festen Pfaden aktualisiert. Die RadioKing-Wiedergabeprüfung und der Rhino-Fehlernachweis dokumentieren eigenständige Ergebnisse mit Datum und damaliger Version. Screenshots nur bei Bedarf erzeugen und keine alten Bildsammlungen ansammeln."
        },
        {
          "Old": "Unter [ANLEITUNGEN/Paket](../ANLEITUNGEN/Paket/) liegen ausschließlich das aktuelle ZIP, drei Manifeste und die Prüfsumme. Frühere Paketstände werden auf Nutzerwunsch nicht aufbewahrt.",
          "New": "Unter [ANLEITUNGEN/Paket](../ANLEITUNGEN/Paket/) liegen ausschließlich das aktuelle ZIP, drei Manifeste und die Prüfsumme. Das ist die einzige ZIP-Ablage; unter UPLOAD liegt nur der fertige Appordner. Frühere Pakete und zweite ZIP-Kopien werden nicht aufbewahrt."
        }
      ],
      "AfterHash": "1e30ab70bba33c4a34836af7b05b4db7e50bb545cfbccee64a96a5a0ecf6b948"
    },
    {
      "Path": "PROJEKT\\docs\\architektur\\ARCHITEKTUR.md",
      "BeforeHash": "3db457d2bf352da3dc21e50bf3d55add11ebe02b26cbb086aa17bc4db57b5b89",
      "Replacements": [
        {
          "Old": "109 Backend-/Vorschaufälle, 97 Browserfälle und echte Rhino-Roundtrips prüfen die Abläufe. `tools/compare-frontend.cjs <Referenz-ZIP>` steht für Pixelvergleiche bei reinen Refaktorisierungen bereit; Sendeplan und Hörerzahl ergänzen sichtbar die Oberfläche. Der aktuelle Nachweis steht in [PRUEFBERICHT.md](../pruefung/PRUEFBERICHT.md). Echte Knuddels-/K3-Abnahme sowie ein tatsächlicher Upload/Neustart bleiben separat und wurden nicht ausgelöst.",
          "New": "114 Backend-/Vorschaufälle, 97 Browserfälle und echte Rhino-Roundtrips prüfen die Abläufe. Das frühere Vergleichswerkzeug für Referenz-ZIPs wurde zusammen mit entbehrlichen Altdateien entfernt; aktuelle Funktions-, Architektur- und Paketprüfungen bleiben erhalten. Der aktuelle Nachweis steht in [PRUEFBERICHT.md](../pruefung/PRUEFBERICHT.md). Echte Knuddels-/K3-Abnahme sowie ein tatsächlicher Upload/Neustart bleiben separat und wurden nicht ausgelöst."
        }
      ],
      "AfterHash": "c56fd065c002c3cd3e144b3e91f1ffaba2b99e42d5025dc5ae3f87899a04498c"
    },
    {
      "Path": "ANLEITUNGEN\\RADIOKING-EINRICHTUNG.txt",
      "BeforeHash": "e782476a3a25fa0ab89a107cb7f9c10ed8c608cfb4a859a6d35324e2a4b40485",
      "Replacements": [
        {
          "Old": "Vorschau: PROJEKT/docs/pruefung/radioking/MischWerk-RadioKing-Wiedergabe.png",
          "New": "Die frühere Screenshotdatei wurde bei der Ordnerbereinigung entfernt; der technische JSON-Nachweis bleibt erhalten."
        }
      ],
      "AfterHash": "b399e9279d4e5a4dd88bcd95bff14ad708783500a1e03cd439a490877506596c"
    },
    {
      "Path": "PROJEKT\\docs\\pruefung\\PRUEFBERICHT.md",
      "BeforeHash": "02a0b86d0f7c8b1850d59905621e5d1fe7b728c696da7ce64c8893bc2fb7c38a",
      "Replacements": [
        {
          "Old": "## Darstellung\n\nAktuelle Implementierung mit gekennzeichneten lokalen Beispieldaten:\n\n- [Sendeplan 820 px, Besitzer](bilder/design/Sendeplan-820.png)\n- [Sendeplan 320 px, Höreransicht](bilder/design/Sendeplan-320.png)\n- [Sendeplan-Editor](bilder/design/Sendeplan-Editor.png)\n\nDie Aufnahmen stammen aus dem gezielten Browserlauf dieser Version. Keine realen Sendungs- oder RadioKing-Verbindungsdaten werden damit behauptet. Auch bei schmalen und niedrigen Fenstern bleiben Bedienung und Inhalte erreichbar. Die leere native Woche bleibt unter 680 px Höhe und wächst bzw. schrumpft weiterhin mit dem Inhalt.\n\n",
          "New": "## Darstellung\n\nDie früheren lokalen Oberflächenaufnahmen wurden beim ausdrücklichen Aufräumauftrag vom 02.11.2026 entfernt. Sie waren keine Laufzeitressourcen und werden für keine Funktion benötigt. Screenshots lassen sich bei Bedarf mit den bestehenden optionalen Aufnahmefunktionen der Browserprüfungen neu erzeugen.\n\n"
        },
        {
          "Old": "- Kurzes ZIP: C:\\Users\\Yves\\Desktop\\MischWerk\\UPLOAD\\MischWerk.zip.\n",
          "New": ""
        },
        {
          "Old": "- Quellen/Laufzeitkopien, Upload und ZIP-Inhalt stimmen überein. Das kurze ZIP ist bytegleich zum geprüften Paket.",
          "New": "- Quellen/Laufzeitkopien, Upload und ZIP-Inhalt stimmen überein. Das aktuelle Paket unter ANLEITUNGEN/Paket ist die einzige ZIP-Ablage."
        },
        {
          "Old": "Nur lokal geändert und paketiert. **Kein FTP-Upload, Knuddels-Update oder Serverneustart.** Die echte Knuddels-/K3-Abnahme bleibt offen. Nach vollständiger autorisierter Übertragung und Update sind Startmeldung 0.1.100, Wochenwechsel, schmale Ansicht und Höhenanpassung auf der Plattform zu prüfen.",
          "New": "Nur lokal geändert und paketiert. **Kein FTP-Upload, Knuddels-Update oder Serverneustart.** Die echte Knuddels-/K3-Abnahme bleibt offen. Nach vollständiger autorisierter Übertragung und Update sind Startmeldung 0.1.100, Wochenwechsel, schmale Ansicht und Höhenanpassung auf der Plattform zu prüfen.\n\n## Ordnerbereinigung vom 02.11.2026\n\nDie 191 geprüften und freigegebenen Altdateien wurden entfernt: 185 Screenshots bzw. Grafikreferenzen, vier alte Emulatormessungen, das überholte Referenz-ZIP-Vergleichswerkzeug und die identische zweite ZIP-Kopie. Zusammen 25.637.884 Bytes (rund 25,6 MB). Keine Sicherungen oder Versionsarchive angelegt.\n\nDer Paketbau erzeugt künftig ausschließlich das aktuelle ZIP unter ANLEITUNGEN/Paket. Verweise auf entfernte Dateien sind angepasst. Die 240 verbleibenden geprüften Dateien werden vor und nach der Bereinigung per SHA-256 kontrolliert; ausschließlich die sechs gezielten Paketbau-/Dokumentationsanpassungen haben neue erwartete Prüfsummen. Appcode, Backendquellen, Upload, API-Referenzen, Tests, Git und Entwicklungsabhängigkeiten bleiben erhalten. App-Version unverändert 0.1.100.\n\nDie oben genannten Funktionsprüfungen stammen aus dem bereits abgeschlossenen Lauf dieser Appversion. Die Bereinigung kontrolliert zusätzlich Projektstruktur, Syntax und Paketintegrität; sie führt keinen Upload oder Neustart aus."
        }
      ],
      "AfterHash": "8245411bfd2173bcda45935769c8437af60ef310fd0681bf0ef525840321a853"
    }
  ]
}
'@ | ConvertFrom-Json

function Get-CleanupPath {
    param([string]$RelativePath)
    if ([IO.Path]::IsPathRooted($RelativePath) -or $RelativePath -match '(^|[\\/])\.{1,2}([\\/]|$)|:') {
        throw "Ungueltiger relativer Pfad: $RelativePath"
    }
    $resolvedPath = [IO.Path]::GetFullPath([IO.Path]::Combine($cleanupRoot, $RelativePath))
    if (!$resolvedPath.StartsWith($cleanupRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw "Pfad ausserhalb des Projektordners: $RelativePath"
    }
    if ($RelativePath -match '^(\.git|PROJEKT[\\/]node_modules)([\\/]|$)') {
        throw "Geschuetzter Verwaltungs- oder Abhaengigkeitsordner: $RelativePath"
    }
    $checkPath = $resolvedPath
    while ($checkPath.Length -ge $cleanupRoot.Length) {
        if (Test-Path -LiteralPath $checkPath) {
            $checkItem = Get-Item -LiteralPath $checkPath -Force
            if ($checkItem.Attributes -band [IO.FileAttributes]::ReparsePoint) {
                throw "Verknuepfung im Zielpfad: $RelativePath"
            }
        }
        if ($checkPath -eq $cleanupRoot) { break }
        $checkPath = [IO.Path]::GetDirectoryName($checkPath)
    }
    return $resolvedPath
}

function Assert-CleanupFile {
    param($Entry)
    $filePath = Get-CleanupPath $Entry.Path
    $fileItem = Get-Item -LiteralPath $filePath -Force
    if ($fileItem.PSIsContainer -or $fileItem.Length -ne $Entry.Bytes) {
        throw "Dateityp oder Dateigroesse weicht ab: $($Entry.Path)"
    }
    if ((Get-FileHash -LiteralPath $filePath -Algorithm SHA256).Hash -ne $Entry.Hash) {
        throw "Datei wurde seit der Pruefung veraendert: $($Entry.Path)"
    }
    return $filePath
}

function Get-CleanupTextHash {
    param([string]$Text)
    $textSha = [Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($textSha.ComputeHash($cleanupUtf8.GetBytes($Text))).Replace('-', '') }
    finally { $textSha.Dispose() }
}

function Assert-ProtectedFiles {
    param([switch]$AfterCleanup)
    foreach ($protectedFile in $cleanupData.Protected) {
        $protectedPath = Get-CleanupPath $protectedFile.Path
        $protectedItem = Get-Item -LiteralPath $protectedPath -Force
        if ($protectedItem.PSIsContainer) { throw "Erforderliche Datei fehlt: $($protectedFile.Path)" }
        $permittedHashes = @($protectedFile.Hash)
        if ($cleanupChanges.ContainsKey($protectedFile.Path)) {
            $expectedAfter = $cleanupChanges[$protectedFile.Path].AfterHash
            if ($AfterCleanup) { $permittedHashes = @($expectedAfter) }
            else { $permittedHashes += $expectedAfter }
        }
        if ($permittedHashes -notcontains (Get-FileHash -LiteralPath $protectedPath -Algorithm SHA256).Hash) {
            throw "Geschuetzte Datei weicht vom geprueften Stand ab: $($protectedFile.Path)"
        }
    }
}

function Get-CleanupNodePath {
    if ($NodePfad) {
        $explicitNode = Get-Item -LiteralPath $NodePfad -Force
        if ($explicitNode.PSIsContainer -or $explicitNode.Extension -ne '.exe') {
            throw '-NodePfad muss auf eine vorhandene node.exe zeigen.'
        }
        return $explicitNode.FullName
    }
    $pathNode = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $pathNode) { return $pathNode.Source }
    $nodeCandidates = @([IO.Path]::GetFullPath((Join-Path $PSHOME '..\..\node\bin\node.exe')))
    if ($env:USERPROFILE) {
        $nodeCandidates += Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    }
    if ($env:ProgramFiles) { $nodeCandidates += Join-Path $env:ProgramFiles 'nodejs\node.exe' }
    if ($env:LOCALAPPDATA) { $nodeCandidates += Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe' }
    foreach ($candidateNode in $nodeCandidates) {
        if (Test-Path -LiteralPath $candidateNode -PathType Leaf) {
            return (Get-Item -LiteralPath $candidateNode -Force).FullName
        }
    }
    throw 'Node.js wurde nicht gefunden. Bitte den vollstaendigen Pfad mit -NodePfad angeben. Es wurde noch nichts geaendert.'
}

function Invoke-CleanupPackageCheck {
    Push-Location -LiteralPath (Join-Path $cleanupRoot 'PROJEKT')
    try {
        & $cleanupNodePath tools/check-package.cjs
        if ($LASTEXITCODE -ne 0) { throw 'Die unabhaengige Paketpruefung ist fehlgeschlagen.' }
    }
    finally { Pop-Location }
}

try {
    $rootItem = Get-Item -LiteralPath $cleanupData.Root -Force
    if (!$rootItem.PSIsContainer -or ($rootItem.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        throw 'Der feste Projektordner fehlt oder ist eine Verknuepfung.'
    }
    $cleanupRoot = [IO.Path]::GetFullPath($rootItem.FullName).TrimEnd('\')
    if ($cleanupRoot -ne $cleanupData.Root -or @($cleanupData.Remove).Count -ne 191) {
        throw 'Projektwurzel oder feste Loeschliste stimmt nicht.'
    }
    $cleanupUtf8 = New-Object System.Text.UTF8Encoding($false, $true)
    $cleanupNodePath = Get-CleanupNodePath
    $cleanupNodeVersion = & $cleanupNodePath --version
    if ($LASTEXITCODE -ne 0 -or $cleanupNodeVersion -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 20) {
        throw 'Fuer die Paketpruefungen wird Node.js ab Version 20 benoetigt.'
    }
    Write-Host ("Node.js: {0} ({1})" -f $cleanupNodePath, $cleanupNodeVersion)
    $cleanupChanges = @{}
    foreach ($change in $cleanupData.Changes) {
        if ($cleanupChanges.ContainsKey($change.Path)) { throw 'Doppelter Aenderungspfad.' }
        $cleanupChanges[$change.Path] = $change
    }
    $protectedNames = @{}
    foreach ($protectedFile in $cleanupData.Protected) { $protectedNames[$protectedFile.Path] = $true }
    $deleteFiles = New-Object 'System.Collections.Generic.List[object]'
    $deleteNames = @{}
    $alreadyMissing = 0
    foreach ($entry in $cleanupData.Remove) {
        if ($deleteNames.ContainsKey($entry.Path) -or $protectedNames.ContainsKey($entry.Path)) {
            throw 'Doppeltes Loeschziel oder Ueberschneidung mit geschuetzten Dateien.'
        }
        $deleteNames[$entry.Path] = $true
        $targetPath = Get-CleanupPath $entry.Path
        if (Test-Path -LiteralPath $targetPath) {
            [void](Assert-CleanupFile $entry)
            $deleteFiles.Add($entry)
        }
        else { $alreadyMissing++ }
    }
    foreach ($emptyDirectory in $cleanupData.EmptyDirectories) { [void](Get-CleanupPath $emptyDirectory) }
    Assert-ProtectedFiles

    # Alle Textanpassungen werden vor der ersten Loeschung im Speicher geprueft.
    $pendingChanges = New-Object 'System.Collections.Generic.List[object]'
    foreach ($change in $cleanupData.Changes) {
        if (!$protectedNames.ContainsKey($change.Path)) { throw 'Textanpassung ausserhalb der geschuetzten Dateiliste.' }
        $changePath = Get-CleanupPath $change.Path
        $currentHash = (Get-FileHash -LiteralPath $changePath -Algorithm SHA256).Hash
        if ($currentHash -eq $change.AfterHash) { continue }
        if ($currentHash -ne $change.BeforeHash) { throw "Aenderungsgrundlage weicht ab: $($change.Path)" }
        $newText = [IO.File]::ReadAllText($changePath, $cleanupUtf8)
        foreach ($replacement in $change.Replacements) {
            $first = $newText.IndexOf($replacement.Old, [StringComparison]::Ordinal)
            if ($first -lt 0 -or $newText.IndexOf($replacement.Old, $first + $replacement.Old.Length, [StringComparison]::Ordinal) -ge 0) {
                throw "Textstelle fehlt oder ist mehrfach vorhanden: $($change.Path)"
            }
            $newText = $newText.Replace($replacement.Old, $replacement.New)
        }
        if ((Get-CleanupTextHash $newText) -ne $change.AfterHash) { throw "Zieltext-Pruefsumme weicht ab: $($change.Path)" }
        $pendingChanges.Add([pscustomobject]@{ Path = $changePath; Text = $newText; BeforeHash = $change.BeforeHash; Relative = $change.Path })
    }
    Invoke-CleanupPackageCheck
    Write-Host ("Geprueft: 191 bekannte Loeschziele; {0} vorhanden, {1} bereits entfernt." -f $deleteFiles.Count, $alreadyMissing)
    Write-Host ("Geschuetzt: {0} Dateien. Gezielte Paketbau-/Dokumentationsanpassungen: {1}." -f @($cleanupData.Protected).Count, $pendingChanges.Count)
    if (!$Loeschen) {
        Write-Host 'Nur geprueft. Keine Datei veraendert. Zum Bereinigen dasselbe Skript mit -Loeschen ausfuehren.'
        return
    }
    if (!$PSCmdlet.ShouldProcess($cleanupRoot, 'Die 191 geprueften Dateien entfernen und zugehoerige Verweise/Paketbau aktualisieren')) { return }

    $cleanupStarted = $true
    foreach ($entry in $deleteFiles) {
        $targetPath = Assert-CleanupFile $entry
        Remove-Item -LiteralPath $targetPath -Force -ErrorAction Stop
    }
    foreach ($entry in $cleanupData.Remove) {
        if (Test-Path -LiteralPath (Get-CleanupPath $entry.Path)) { throw "Loeschziel ist noch vorhanden: $($entry.Path)" }
    }
    foreach ($update in $pendingChanges) {
        [void](Get-CleanupPath $update.Relative)
        if ((Get-FileHash -LiteralPath $update.Path -Algorithm SHA256).Hash -ne $update.BeforeHash) {
            throw "Textdatei wurde waehrend der Bereinigung veraendert: $($update.Relative)"
        }
        [IO.File]::WriteAllText($update.Path, $update.Text, $cleanupUtf8)
    }
    # Ausschliesslich bekannte, inzwischen leere Ordner; niemals rekursiv loeschen.
    foreach ($relativeDirectory in ($cleanupData.EmptyDirectories | Sort-Object { $_.Length } -Descending)) {
        $emptyPath = Get-CleanupPath $relativeDirectory
        if (Test-Path -LiteralPath $emptyPath -PathType Container) {
            if (@(Get-ChildItem -LiteralPath $emptyPath -Force).Count -eq 0) {
                Remove-Item -LiteralPath $emptyPath -Force -ErrorAction Stop
            }
        }
    }
    Assert-ProtectedFiles -AfterCleanup
    Push-Location -LiteralPath (Join-Path $cleanupRoot 'PROJEKT')
    try {
        & $cleanupNodePath tools/check.cjs
        if ($LASTEXITCODE -ne 0) { throw 'Die Projektpruefung ist fehlgeschlagen.' }
        & $cleanupNodePath --check tools/build-install.cjs
        if ($LASTEXITCODE -ne 0) { throw 'Die Paketbau-Syntaxpruefung ist fehlgeschlagen.' }
    }
    finally { Pop-Location }
    Invoke-CleanupPackageCheck
    Write-Host ("Fertig: {0} Dateien entfernt; {1} waren bereits entfernt. Keine Sicherungen erstellt." -f $deleteFiles.Count, $alreadyMissing) -ForegroundColor Green
    Write-Host 'App, Quellcode, Upload und aktuelles Installationspaket sind erhalten. Version weiterhin 0.1.100.'
}
catch {
    Write-Error -Message ("Bereinigung abgebrochen: " + $_.Exception.Message) -ErrorAction Continue
    if ($cleanupStarted) {
        Write-Host 'Bei einem Fehler nach Beginn kann ein Teil bereits bereinigt sein. Erneuter Aufruf prueft den verbleibenden Stand.'
    }
    else {
        Write-Host 'Vor Dateiaenderungen abgebrochen. Keine Datei wurde geloescht oder veraendert.'
    }
    exit 1
}
