package com.sport.web_sport.config;

import org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy;
import org.hibernate.boot.model.naming.Identifier;
import org.hibernate.engine.jdbc.env.spi.JdbcEnvironment;

/**
 * Spring Boot의 기본 {@link CamelCaseToUnderscoresNamingStrategy}는 백틱·따옴표로
 * 명시한 인용 식별자까지 소문자화한다. 그 결과 Oracle에서 {@code "rank"}(소문자 인용)는
 * 실제 컬럼 {@code RANK}와 매칭되지 않아 ORA-00904가 발생한다.
 * 이 전략은 인용된 이름이면 그대로 보존하고, 그렇지 않으면 기본 동작(스네이크 케이스 변환)을 따른다.
 */
public class PreserveQuotedNamingStrategy extends CamelCaseToUnderscoresNamingStrategy {

    @Override
    public Identifier toPhysicalColumnName(Identifier name, JdbcEnvironment jdbcEnvironment) {
        if (name != null && name.isQuoted()) {
            return name;
        }
        return super.toPhysicalColumnName(name, jdbcEnvironment);
    }

    @Override
    public Identifier toPhysicalTableName(Identifier name, JdbcEnvironment jdbcEnvironment) {
        if (name != null && name.isQuoted()) {
            return name;
        }
        return super.toPhysicalTableName(name, jdbcEnvironment);
    }
}
