package com.sport.web_sport.soccer.service;

import com.sport.web_sport.common.error.BusinessException;
import com.sport.web_sport.soccer.dto.FixtureSearchCondition;
import com.sport.web_sport.soccer.entity.Fixture;
import com.sport.web_sport.soccer.repository.FixtureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FixtureService {

    private final FixtureRepository fixtureRepository;

    public Page<Fixture> search(FixtureSearchCondition c) {
        int page = c.getPageOrDefault();
        int size = c.getSizeOrDefault();
        Sort sort = "oldest".equals(c.getSortOrDefault())
                ? Sort.by("matchDate").ascending()
                : Sort.by("matchDate").descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return fixtureRepository.search(
                c.getSeason(),
                c.getStatus(),
                c.getTeamId(),
                c.getKeywordOrNull(),
                pageable);
    }

    public Fixture findById(String id) {
        return fixtureRepository.findByIdWithTeams(id)
                .orElseThrow(() -> new BusinessException("경기를 찾을 수 없습니다."));
    }
}
