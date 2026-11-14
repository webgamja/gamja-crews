# gamja-crews

Crews for [Gamja](https://github.com/webgamja/gamja) — instructions you can add to your crew tab and keep up to date.
감자 크루탭에 추가하고 최신으로 유지할 수 있는 크루 지침 모음이에요.

## 구조 / Layout

```
crews/<id>/crew.json   이름·소개·아이콘·제작자·최신 버전
crews/<id>/<ver>.md    버전별 지침 (옛 버전도 지우지 않아요)
OFFICIAL.json          🌱 감자 배지를 받은(직접 시험한) 크루 목록 — 관리자만 고쳐요
index.json             자동 생성 파일 — 손으로 고치지 마세요
tools/build-index.js   검사 + index.json 생성
```

감자는 `index.json`만 읽어서 새 버전이 있는지 확인하고, 사용자가 업데이트를 누를 때만 지침 파일을 받아요. 받은 파일은 `index.json`의 해시와 같아야 적용돼요.

## 등급 / Trust levels

- **🌱 공식**: 감자 팀이 직접 시험하고 올린 크루. `OFFICIAL.json`에 있어요.
- **커뮤니티**: 다른 사용자가 올린 크루. 추가하기 전에 "다른 사용자가 만든 크루"라는 안내와 지침 미리보기가 나와요.

## 크루 올리기 / Contributing

1. `crews/<id>/` 폴더에 `crew.json`과 `<버전>.md`를 만들어요. 폴더 이름은 영문 소문자·숫자·`-`(3~40자)예요.
2. `node tools/build-index.js` 로 검사하고 `index.json`을 새로 만들어요.
3. PR을 열고, 커밋에 서명(`git commit -s`, DCO)을 붙여요. 관리자가 지침을 읽어 본 뒤 합쳐요.

지침은 64KB 이하의 UTF-8 글이어야 하고, 라이선스는 Apache-2.0이에요. 사용자 파일을 지우거나 비밀 정보를 보내라는 식의 지시, 다른 크루나 사이트인 척하는 내용은 받지 않아요. 새 버전은 새 파일(`<새버전>.md`)로 올리고 `crew.json`의 `latest`를 바꿔요.

## 라이선스 / License

Apache-2.0
