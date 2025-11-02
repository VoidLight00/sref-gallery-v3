const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
  process.exit(1);
}

// Supabase 클라이언트 생성 (Service Role Key 사용)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Supabase 마이그레이션 시작...\n');

  try {
    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', '001_initial_setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 마이그레이션 파일 로드 완료');
    console.log(`   파일: ${sqlPath}`);
    console.log(`   크기: ${sql.length} bytes\n`);

    // SQL을 개별 명령어로 분리 (세미콜론 기준)
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 총 ${commands.length}개의 SQL 명령어 실행 예정\n`);

    let successCount = 0;
    let errorCount = 0;

    // 각 SQL 명령어를 순차적으로 실행
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      const preview = command.substring(0, 60).replace(/\s+/g, ' ');

      try {
        console.log(`[${i + 1}/${commands.length}] 실행 중: ${preview}...`);

        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command + ';'
        });

        if (error) {
          // 이미 존재하는 객체 에러는 무시 (ON CONFLICT, IF EXISTS 등)
          if (
            error.message.includes('already exists') ||
            error.message.includes('duplicate key') ||
            error.message.includes('relation') && error.message.includes('does not exist')
          ) {
            console.log(`   ⚠️  스킵: ${error.message}`);
          } else {
            console.error(`   ❌ 오류: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log('   ✅ 성공');
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ 예외: ${err.message}`);
        errorCount++;
      }

      // 너무 빠르게 요청하지 않도록 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ 마이그레이션 완료!`);
    console.log(`   성공: ${successCount}개`);
    console.log(`   실패: ${errorCount}개`);
    console.log('='.repeat(60) + '\n');

    // 테이블 목록 확인
    console.log('📊 생성된 테이블 확인 중...\n');

    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('테이블 목록 조회 실패:', tablesError.message);
    } else if (tables && tables.length > 0) {
      console.log('생성된 테이블:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }

  } catch (error) {
    console.error('\n❌ 마이그레이션 실행 중 오류 발생:');
    console.error(error);
    process.exit(1);
  }
}

// 실행
runMigration()
  .then(() => {
    console.log('\n🎉 모든 작업이 완료되었습니다!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 작업 실패:', error);
    process.exit(1);
  });
