import { LegalDoc, LegalSection } from "@/components/LegalDoc";

export const metadata = {
  title: "개인정보 처리방침 · 마이보이스스토리 for 키즈",
};

export default function PrivacyPage() {
  return (
    <LegalDoc title="개인정보 처리방침" updatedAt="2026년 7월 13일">
      <LegalSection heading="1. 수집하는 개인정보 항목">
        <p>· 필수: 이메일, 비밀번호(암호화 저장)</p>
        <p>· 선택: 보호자 호칭, 아이 이름·나이·성별</p>
        <p>· 서비스 이용 과정에서 생성: 등록한 목소리 메타데이터, 만든 동화, 재생 기록</p>
      </LegalSection>

      <LegalSection heading="2. 개인정보의 수집 및 이용 목적">
        <p>· 회원 식별 및 로그인 등 계정 관리</p>
        <p>· 보호자 목소리 기반 동화 낭독 음성 생성 및 제공</p>
        <p>· 아이 정보 기반 동화 추천 및 맞춤 인사</p>
        <p>· 서비스 개선 및 문의 대응</p>
      </LegalSection>

      <LegalSection heading="3. 음성 데이터의 처리">
        <p>
          등록한 목소리는 동화 낭독을 위한 음성 합성 목적에 한하여 이용되며,
          음성 합성 처리를 위해 음성 AI 처리 업체(ElevenLabs)에 전송·처리될 수
          있습니다. 이용자가 목소리를 삭제하면 관련 데이터도 지체 없이 삭제됩니다.
        </p>
      </LegalSection>

      <LegalSection heading="4. 보유 및 이용 기간">
        <p>
          개인정보는 회원 탈퇴 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다.
          다만 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
        </p>
      </LegalSection>

      <LegalSection heading="5. 아동의 개인정보 보호">
        <p>
          아이의 이름·나이 등은 보호자(법정대리인)가 직접 입력·관리하며, 동화
          추천과 인사말 표시 목적으로만 이용됩니다. 보호자는 언제든지 아이 정보를
          수정하거나 삭제할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="6. 이용자의 권리">
        <p>
          이용자는 언제든지 본인 및 아이의 개인정보 열람·정정·삭제, 처리 정지를
          요청할 수 있으며, 회원 탈퇴를 통해 수집·이용 동의를 철회할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="7. 동의 거부 권리 및 불이익">
        <p>
          이용자는 필수 항목 수집·이용에 대한 동의를 거부할 권리가 있으나, 거부
          시 회원가입 및 서비스 이용이 제한될 수 있습니다.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
