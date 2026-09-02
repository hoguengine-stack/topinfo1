# TOPINFO Content Contract

## Verified Business Information

Use these values from the current project settings unless the user supplies an update:

- Company: 탑정보통신
- Representative / privacy officer: 김다미
- Address: 경기도 안산시 상록구 천문로17 일영빌딩 2층
- Telephone / AS: 031-487-4401
- Email: kicckmk@naver.com
- Business registration number: 217-30-00018
- Public relationship currently described by the project: 토스플레이스 직계약 대리점
- Basic POS hardware described by the project: POSBANK APEXA X-1500 with Toss POS

The relationship claim, service area, business hours, pricing, inventory, and promotion conditions must be revalidated before production publication.

## Voice

- Write for a Korean store owner who needs a clear decision, not for an industry conference.
- Explain the operating situation before the product model.
- Put one idea in each sentence.
- Prefer verbs and concrete nouns: configure, connect, install, explain, receive, print, settle, replace.
- State what TOPINFO does and what the product/platform provider does separately.
- Explain technical terms when they are needed.
- Use restrained confidence. Avoid `혁신적인`, `완벽한`, `최고의`, `압도적인`, `유일한`, and unqualified superlatives.
- Do not repeat one slogan across sections.

## Claim Rules

Do not publish a claim unless its source, owner, date, and applicable conditions are known.

- No invented customer count, installation count, approval rate, transaction value, operating years, satisfaction rate, or response time.
- No fabricated customer reviews, names, stores, or before/after results.
- No `무료`, `0원`, `전액 지원`, `평생`, `24시간`, or `전국` without an explicit current contract and conditions.
- No government support or official partner wording without current documentary proof.
- No implied compatibility. Use `지원`, `별도 가입`, `현장 확인`, or `확인 필요` precisely.
- If a fact is not ready, hide the public claim and add it to the internal confirmation list.

## CTA Rules

Good CTAs describe the result:

- 내 매장 구성 상담하기
- 필요한 장비 비교하기
- 토스POS 구성 확인하기
- 설치 가능 지역 문의하기
- 기존 POS 교체 상담하기
- 전화로 바로 문의하기
- POS 설치 범위 확인하기
- 현재 적용 조건 확인하기

Avoid:

- 더 알아보기
- 시작하기
- 클릭하세요
- 자세히 보기 when a more specific result is possible
- 혁신을 경험하세요

Use one primary CTA per section. New-customer consultation and existing-customer support must remain distinguishable.

## Page Content

### Home

Purpose: establish TOPINFO as the party that connects store planning, equipment, installation, education, and support.

Recommended hero direction:

- Heading: `계산대가 아니라, 매장의 흐름을 설계합니다.`
- Support: `POS·결제·키오스크·테이블오더·프린터를 매장 운영 방식에 맞춰 구성하고, 설치와 사용 안내까지 연결합니다.`
- Primary CTA: `내 매장 구성 상담`
- Secondary CTA: `토스POS 살펴보기`

Evidence should be non-numeric until TOPINFO supplies verified metrics: actual product families, actual support paths, business information, process, and documented partner relationship.

### Solutions / Products

Start with operating problems and then compare product forms:

- POS
- Payment terminals
- Front/customer display
- Kiosk
- Table order
- Waiting/KDS where actually provided
- Printer, cash drawer, scanner
- Delivery/order integration
- Internet, AI phone/internet phone, CCTV where actually provided
- Used POS where stock, grade, and warranty are verified

Every solution page answers:

1. What it is
2. Which stores need it
3. Which operating problem it solves
4. What is included and optional
5. How it is used in the store
6. Verified major functions
7. Compatibility and external subscriptions
8. Installation conditions
9. Actual product/UI evidence
10. Selection criteria
11. FAQ
12. Consultation action

### Toss POS

Keep the boundaries explicit:

- Toss Place provides its products and service features.
- TOPINFO helps the customer confirm configuration, installation conditions, education, and subsequent support within the verified agency scope.
- Use only verified official product names, UI, policy, and benefit information.
- Toss blue is reserved for this product context; TOPINFO remains the page owner.
- If price, stock, benefit, signup, or compatibility varies, state what requires consultation rather than guessing.

### Industries

Describe the work sequence rather than repeating a feature-card wall.

- Cafe/bakery: quick menu selection -> options and points -> payment -> order ticket -> inventory/closing
- Restaurant: menu/table setup -> order reception -> kitchen output -> payment -> sales closing
- Pub/bar: table order -> additional order -> table operation -> payment -> closing
- Retail: product registration -> barcode/inventory -> customer/points -> payment -> sales data
- Beauty/service: booking -> staff schedule -> notification -> customer note -> payment
- Unmanned/multi-store/B2B: publish only if the provided equipment and support scope are verified

For every industry, show what improves the specific workflow. Do not reuse the same generic product lineup image as the only evidence.

### Promotions

The page is a maintained conditions module, not an advertisement image.

Required fields:

- Promotion name
- Current status and reference date
- Application period
- Eligible customer
- Included product, exact model, quantity, and ownership/rental/provided status
- Monthly and one-time costs, contract party, and VAT
- Contract term, combination, installation, cancellation, return, and separate costs
- Exclusions and inventory variability
- Application steps
- Consultation action and telephone

When current promotion data is absent, use: `현재 적용 가능한 혜택과 조건은 상담 시 확인해 드립니다.` Do not invent a discount or free package.

### Used POS / Replacement

Do not imply new-equipment condition. Publish only known inventory information:

- Exact model
- Grade and cosmetic criteria
- Inspection checklist
- Included accessories
- Software/license status
- Warranty/support scope
- Stock date
- Replacement and disposal conditions

### Support

Separate the following actions:

- Installation/AS telephone
- Paper request
- Product manuals/resources
- Suggestion/problem report
- Existing consultation status where authentication allows it

State realistic routing: a public consultation creates a `consultations` record and appears in the consultation inbox; it becomes an internal work task only after the employee conversion step unless automation is separately implemented.

### Consultation Form

Candidate fields:

- Industry
- New opening or replacement
- Interested solution
- Installation area
- Expected timing
- Contact name and telephone
- Inquiry
- Privacy consent

Do not display a received/success state before the Firestore write resolves. On failure, preserve entered values, explain the error, and provide `031-487-4401` as a fallback.

## FAQ Source Set

Use only answers supported by the current service scope:

- POS 제품을 잘 몰라도 상담할 수 있나요?
- 기존 장비와 연동할 수 있나요?
- 토스POS와 일반 POS의 차이는 무엇인가요?
- 키오스크와 테이블오더 중 무엇이 적합한가요?
- 설치 전 인터넷과 전원 위치도 확인해야 하나요?
- 중고 POS 구매 전 무엇을 확인해야 하나요?
- 설치 후 AS와 용지 요청은 어디에서 하나요?
- 상담 신청 후 바로 작업 일정이 만들어지나요?

Answers must state when a site inspection, external signup, product version, or partner confirmation is needed.

## Internal Confirmation List

Keep these off the public page until verified:

- Documentary basis and display rules for `토스플레이스 직계약 대리점`
- Current LG U+ agency/product-media usage scope
- Exact installation/AS service area and operating hours
- Current promotion, price, VAT, contract, combination, and stock conditions
- Whether paper delivery is free, to whom, and under which quantity/contract conditions
- Whether any service is actually 24-hour
- Product-image and official-UI local redistribution rights
- Actual installation cases with customer and location publication consent
- Real consultation response time and any service-level commitment
- Anti-spam/App Check policy for public Firestore forms

